const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Compile the actual integration helpers in memory; no generated files or test dependencies.
const modules = new Map();
function load(name) {
  if (!name.startsWith("@/")) return require(name);
  if (modules.has(name)) return modules.get(name);
  const filename = path.resolve(
    __dirname,
    "..",
    "src",
    name.replace("@/", "") + ".ts",
  );
  const module = { exports: {} };
  modules.set(name, module.exports);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    load,
    module,
    module.exports,
  );
  return module.exports;
}
process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
const storage = new Map();
global.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const api = load("@/lib/api");
const axios = require("axios");

// Keep integration tests deterministic while exercising the real Axios
// interceptors, serialization, authentication, and error mapping.
api.apiClient.defaults.adapter = async (config) => {
  let response;
  try {
    response = await global.fetch(config.baseURL + config.url, {
      method: config.method.toUpperCase(),
      headers: config.headers,
      body: config.data,
    });
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw axios.AxiosError.from(
      error,
      axios.AxiosError.ERR_NETWORK,
      config,
    );
  }

  let data;
  if (config.responseType === "blob") {
    data = await response.blob();
  } else {
    const text = await response.text();
    data = text;
    try {
      data = JSON.parse(text);
    } catch {}
  }
  const axiosResponse = {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers),
    config,
    request: null,
  };
  if (!response.ok) {
    throw new axios.AxiosError(
      "Request failed with status code " + response.status,
      axios.AxiosError.ERR_BAD_RESPONSE,
      config,
      null,
      axiosResponse,
    );
  }
  return axiosResponse;
};
const applications = load("@/lib/applications");
const utils = load("@/lib/utils");
const workflow = load("@/lib/workflow");
const fixture = {
  id: "test-id",
  no_permohonan: "TEST-001",
  pelanggan_nama: "Test",
  pelanggan_alamat: "Test address",
  pelanggan_no_hp: "08123456789",
  jenis_permohonan: "Pasang Baru (PB)",
  jenis_sambungan: "JTM/Gardu",
  ulp_unit: "Test unit",
  request_date: "2026-09-09",
  current_stage: 4,
  status: "in_progress",
  kebutuhan_tiang: false,
  perlu_pdkb: false,
  nps_delegation_status: "delegated",
  workflow_nodes: [
    {
      workflow_node: "wo_konstruksi",
      stage_number: 4,
      status: "completed",
      sla_status: "on_time",
    },
    {
      workflow_node: "wo_app",
      stage_number: 4,
      status: "available",
      sla_status: "due_soon",
    },
    {
      workflow_node: "pelaksanaan_konstruksi",
      stage_number: 5,
      status: "available",
      sla_status: "overdue",
      sla_deadline: "2026-09-12",
    },
    {
      workflow_node: "pemasangan_tiang",
      stage_number: 5,
      status: "skipped",
      sla_status: "none",
    },
  ],
  available_actions: [
    {
      workflow_node: "wo_app",
      path: "/api/permohonan/test-id/wo-vendor/app",
      method: "POST",
    },
  ],
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("server projection tolerates a missing request date", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    request_date: null,
  });

  assert.equal(mapped.requestedAt, "");
});

test("date formatting tolerates empty and invalid API values", () => {
  const options = { day: "numeric", month: "short", year: "numeric" };

  assert.equal(utils.formatApiDate(null, options), "—");
  assert.equal(utils.formatApiDate("not-a-date", options), "—");
  assert.notEqual(utils.formatApiDate("2026-09-09", options), "—");
});

beforeEach(() => {
  storage.clear();
  api.saveTokens({
    access_token: "access-test",
    refresh_token: "refresh-test",
  });
  global.fetch = async () => {
    throw new Error("Unexpected request");
  };
});

test("server projection retains parallel and skipped nodes and server permissions", () => {
  const mapped = applications.mapApplication(fixture);
  assert.equal(mapped.connectionType, "JTM / Gardu");
  assert.equal(mapped.currentStage, 4);
  assert.equal(mapped.sla.tone, "late");
  assert.equal(mapped.sla.deadline, "2026-09-12");
  assert.deepEqual(mapped.availableActions, fixture.available_actions);
  assert.equal(
    mapped.nodes.find((node) => node.workflow_node === "wo_konstruksi").status,
    "completed",
  );
  assert.equal(
    mapped.nodes.find((node) => node.workflow_node === "pemasangan_tiang")
      .status,
    "skipped",
  );
  assert.deepEqual(mapped.documents, []);
  assert.deepEqual(mapped.history, []);
  assert.equal(mapped.power, "—");
  assert.equal(
    workflow.getApplicationStatus({ ...mapped, status: "returned" }),
    "Ditolak",
  );
  assert.equal(
    workflow.getApplicationStatus({ ...mapped, status: "completed" }),
    "Selesai",
  );
});

test("SLA reminder is scoped to the role that owns the available node", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    available_actions: [
      {
        ...fixture.available_actions[0],
        workflow_node: "pelaksanaan_konstruksi",
      },
    ],
  });

  assert.equal(
    workflow.getOwnedSla(mapped, "vendor-konstruksi")?.deadline,
    "2026-09-12",
  );
  assert.equal(workflow.getOwnedSla(mapped, "konstruksi"), null);
});

test("SLA deadline falls back to the current stage node", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    workflow_nodes: [
      {
        ...fixture.workflow_nodes[0],
        status: "completed",
        sla_status: "none",
        sla_deadline: "2026-09-15",
      },
    ],
  });
  assert.equal(mapped.sla.deadline, "2026-09-15");
});

test("list follows pagination without requesting details per row", async () => {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    return json({
      data: [{ ...fixture, id: "id-" + calls.length }],
      status: "success",
      pagination: { max_page: 2 },
    });
  };
  const rows = await applications.getApplications();
  assert.deepEqual(
    rows.map((row) => row.id),
    ["id-1", "id-2"],
  );
  assert.equal(calls.length, 2);
  assert.ok(calls.every((url) => url.includes("/api/permohonan?page=")));
});

test("create sends only the supplied API fields and bearer token", async () => {
  const payload = {
    jenis_permohonan: "Pasang Baru (PB)",
    jenis_sambungan: "JTR",
    pelanggan_nama: "Test",
    pelanggan_alamat: "Test address",
    pelanggan_no_hp: "08123456789",
  };
  global.fetch = async (url, init) => {
    assert.equal(url, "https://api.example.test/api/permohonan");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.get("Authorization"), "Bearer access-test");
    assert.deepEqual(JSON.parse(init.body), payload);
    return json({ status: true, data: fixture });
  };
  assert.equal((await applications.createApplication(payload)).id, fixture.id);
});

const cases = [
  [
    "survei",
    "survei",
    { surveyed_at: "2026-09-09", notes: "Test" },
    { surveyed_at: "2026-09-09", notes: "Test" },
  ],
  [
    "rab_kko_kkf",
    "rab-kko-kkf",
    { kebutuhan_tiang: "Tidak" },
    { kebutuhan_tiang: false },
  ],
  [
    "rab_kko_kkf",
    "rab-kko-kkf",
    { kebutuhan_tiang: "Ya" },
    { kebutuhan_tiang: true },
  ],
  [
    "kebutuhan_tiang",
    "rab-kko-kkf",
    { kebutuhan_tiang: "Ya" },
    { kebutuhan_tiang: true },
  ],
  [
    "permohonan_perluasan",
    "permohonan-perluasan",
    { nps_delegation_status: "Dikembalikan" },
    { nps_delegation_status: "returned" },
  ],
  [
    "permohonan_perluasan",
    "permohonan-perluasan",
    { nps_delegation_status: "Didelegasikan" },
    { nps_delegation_status: "delegated" },
  ],
  [
    "wo_konstruksi",
    "wo-vendor/konstruksi",
    { perlu_pdkb: "Tidak" },
    { perlu_pdkb: false },
  ],
  [
    "wo_konstruksi",
    "wo-vendor/konstruksi",
    { perlu_pdkb: "Ya" },
    { perlu_pdkb: true },
  ],
  ["wo_tiang", "wo-vendor/tiang", {}, {}],
  ["wo_app", "wo-vendor/app", {}, {}],
  ["wo_pdkb", "wo-pdkb", {}, {}],
  ["pk_vendor", "pk-vendor", {}, {}],
  [
    "reservasi_material",
    "reservasi-material",
    {
      notes: "Must not be sent",
      reservation_notes: "Reserve",
      tera_notes: "Tera",
    },
    { reservation_notes: "Reserve", tera_notes: "Tera" },
  ],
  [
    "pemasangan_tiang",
    "pelaksanaan-konstruksi",
    {},
    { workflow_node: "pemasangan_tiang" },
  ],
  [
    "pelaksanaan_konstruksi",
    "pelaksanaan-konstruksi",
    {},
    { workflow_node: "pelaksanaan_konstruksi" },
  ],
  ["pdkb_documentation", "pdkb-dokumentasi", {}, {}],
  [
    "energize_jaringan",
    "energize-jaringan",
    { operation_result: "Test result" },
    { operation_result: "Test result" },
  ],
  ["pemasangan_sr_app", "pemasangan-sr-app", {}, {}],
  ["entri_mutasi_pdl", "closing", {}, {}],
];
for (const [node, endpoint, values, expected] of cases) {
  test("action contract: " + node + " " + JSON.stringify(values), async () => {
    global.fetch = async (url, init) => {
      assert.equal(
        url,
        "https://api.example.test/api/permohonan/test-id/" + endpoint,
      );
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(init.body), {
        document_ids: ["document-id"],
        ...expected,
      });
      return json({
        status: true,
        data: { ...fixture, status: "returned", available_actions: [] },
      });
    };
    const result = await applications.submitAction(
      "test-id",
      {
        workflow_node: node,
        path: "/api/permohonan/{id}/" + endpoint,
        method: "POST",
      },
      values,
      ["document-id"],
    );
    assert.equal(result.status, "returned");
    assert.deepEqual(result.availableActions, []);
  });
}

test("upload uses multipart bytes with backend field names", async () => {
  const file = new File(["test evidence"], "test.pdf", {
    type: "application/pdf",
  });
  global.fetch = async (url, init) => {
    assert.equal(url, "https://api.example.test/api/documents");
    assert.ok(init.body instanceof FormData);
    assert.equal(init.body.get("type"), "evidence");
    assert.equal(await init.body.get("file").text(), "test evidence");
    assert.notEqual(init.headers.get("Content-Type"), "application/json");
    return json({ status: true, data: { id: "real-document-id" } });
  };
  assert.equal(
    (await applications.uploadEvidence(file)).id,
    "real-document-id",
  );
});

test("upload reports an oversized payload when the gateway hides its 413 response", async () => {
  const file = new File(["test evidence"], "test.pdf", {
    type: "application/pdf",
  });
  global.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(
    () => applications.uploadEvidence(file),
    /Ukuran konten terlalu besar/,
  );
});

test("HTTP 413 has a clear upload-size message", async () => {
  global.fetch = async () => new Response(null, { status: 413 });
  await assert.rejects(
    () => applications.uploadEvidence(new File(["test"], "test.pdf")),
    (error) =>
      error.status === 413 && /Ukuran konten terlalu besar/.test(error.message),
  );
});

test("history title is derived from workflow_node instead of action", async () => {
  global.fetch = async () =>
    json({
      status: true,
      data: [
        {
          id: "log-id",
          created_at: "2026-09-09T10:00:00Z",
          action: "legacy_action_value",
          workflow_node: "survei",
          actor: "actor-id",
          detail: "Survei lapangan lengkap",
        },
        {
          id: "duplicate-log-id",
          created_at: "2026-09-09T10:00:00Z",
          action: "another_legacy_action_value",
          workflow_node: "survei",
          actor: "actor-id",
          detail: "Survei lapangan lengkap",
        },
      ],
    });

  const history = await applications.getApplicationHistory("test-id");
  assert.equal(history.length, 1);
  const [first] = history;
  assert.equal(first.title, workflow.getActivity("2").label);
  assert.equal(first.detail, "Survei lapangan lengkap");
  assert.notEqual(first.title, "legacy_action_value");
});

test("document content uses the authenticated permohonan endpoint", async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      url,
      "https://api.example.test/api/permohonan/test-id/documents/document-id",
    );
    assert.equal(init.headers.get("Authorization"), "Bearer access-test");
    return new Response("document bytes", {
      headers: { "Content-Type": "application/pdf" },
    });
  };

  const blob = await applications.getApplicationDocument(
    "test-id",
    "document-id",
  );
  assert.equal(await blob.text(), "document bytes");
});

for (const status of [400, 403, 404, 409, 500]) {
  test(
    "HTTP " + status + " surfaces backend error without mutation success",
    async () => {
      global.fetch = async () =>
        json(
          {
            status: false,
            message: "Failed operation",
            error: "Backend validation detail",
          },
          status,
        );
      await assert.rejects(
        () => applications.getApplication("test-id"),
        (error) =>
          error.status === status &&
          error.message === "Backend validation detail",
      );
    },
  );
}

test("expired access token refreshes once and retries using the new token", async () => {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push(url);
    if (calls.length === 1) return json({ status: false }, 401);
    if (url.endsWith("/auth/refresh")) {
      assert.deepEqual(JSON.parse(init.body), {
        refresh_token: "refresh-test",
      });
      assert.equal(init.headers.has("Authorization"), false);
      return json({
        status: true,
        data: { access_token: "new-access", refresh_token: "new-refresh" },
      });
    }
    assert.equal(init.headers.get("Authorization"), "Bearer new-access");
    return json({ status: true, data: fixture });
  };
  await applications.getApplication("test-id");
  assert.equal(calls.length, 3);
});

test("invalid session is cleared on rejected refresh", async () => {
  global.fetch = async () => json({ status: false, message: "Expired" }, 401);
  await assert.rejects(
    () => applications.getApplication("test-id"),
    (error) => error.status === 401,
  );
  assert.equal(storage.size, 0);
});

test("network and non-JSON server failures remain visible errors", async () => {
  global.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(
    () => applications.getApplication("test-id"),
    /Tidak dapat menghubungi API/,
  );
  global.fetch = async () =>
    new Response("<html>Server unavailable</html>", { status: 500 });
  await assert.rejects(
    () => applications.getApplication("test-id"),
    (error) => error.status === 500,
  );
});

test("action cannot post to another request or a remote origin", async () => {
  await assert.rejects(
    () =>
      applications.submitAction(
        "test-id",
        {
          workflow_node: "survei",
          method: "POST",
          path: "https://elsewhere.test/api/permohonan/test-id/survei",
        },
        {},
        ["document-id"],
      ),
    /Tindakan backend tidak dikenali/,
  );
});
