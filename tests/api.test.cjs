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
const users = load("@/lib/users");
const utils = load("@/lib/utils");
const workflow = load("@/lib/workflow");
const exporter = load("@/lib/export-applications");
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

test("SLA day labels handle late and upcoming deadlines", () => {
  assert.equal(utils.getSlaDaysRemaining("not-a-date"), null);
  assert.equal(utils.formatSlaRemaining(-2), "Terlambat 2 hari");
  assert.equal(utils.formatSlaRemaining(3), "Tersisa 3 hari");
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
  assert.equal(
    workflow.getApplicationStatus({ ...mapped, status: "returned" }),
    "PK dikembalikan",
  );
  assert.equal(
    workflow.getApplicationStatus({ ...mapped, status: "completed" }),
    "Selesai",
  );
});

test("vendor status resolves to completed when all vendor-owned tasks are finished", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    status: "in_progress",
    workflow_nodes: [
      ...fixture.workflow_nodes,
      {
        workflow_node: "pemasangan_tiang",
        stage_number: 5,
        status: "completed",
        sla_status: "none",
      },
    ],
    available_actions: [],
  });

  assert.equal(
    workflow.getApplicationStatus(mapped, "vendor-tiang"),
    "Selesai",
  );
  assert.equal(
    workflow.getApplicationStatus(mapped, "vendor-konstruksi"),
    "Menunggu tindakan",
  );
});

test("vendor SLA is hidden when the remaining overdue work belongs to another role", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    status: "in_progress",
    workflow_nodes: [
      {
        workflow_node: "pelaksanaan_konstruksi",
        stage_number: 5,
        status: "completed",
        sla_status: "none",
      },
      {
        workflow_node: "pemasangan_tiang",
        stage_number: 5,
        status: "completed",
        sla_status: "none",
      },
    ],
    available_actions: [],
  });

  assert.deepEqual(workflow.getOwnedSla(mapped, "vendor-konstruksi"), {
    tone: "done",
    label: "Selesai",
    deadline: null,
  });
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

test("list SLA fields take precedence over per-node fallback", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    sla_status: "on_time",
    sla_deadline: "2026-10-30",
  });

  assert.equal(mapped.sla.tone, "safe");
  assert.equal(mapped.sla.deadline, "2026-10-30");
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

test("create posts multipart fields, evidence files, and bearer token", async () => {
  const file = new File(["ktp bytes"], "ktp.pdf", { type: "application/pdf" });
  const payload = {
    jenis_permohonan: "Pasang Baru (PB)",
    jenis_sambungan: "JTR",
    pelanggan_nama: "Test",
    pelanggan_alamat: "Test address",
    pelanggan_no_hp: "08123456789",
    tarif: "rumah_tangga",
    daya_baru: 2200,
    evidence_files: [file],
  };
  global.fetch = async (url, init) => {
    assert.equal(url, "https://api.example.test/api/permohonan");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.get("Authorization"), "Bearer access-test");
    assert.ok(init.body instanceof FormData);
    assert.equal(init.body.get("jenis_permohonan"), "Pasang Baru (PB)");
    assert.equal(init.body.get("jenis_sambungan"), "JTR");
    assert.equal(init.body.get("tarif"), "rumah_tangga");
    assert.equal(init.body.get("daya_baru"), "2200");
    // Pasang Baru sends no daya_lama.
    assert.equal(init.body.get("daya_lama"), null);
    const files = init.body.getAll("evidence_files");
    assert.equal(files.length, 1);
    assert.equal(await files[0].text(), "ktp bytes");
    return json({ status: true, data: fixture });
  };
  assert.equal((await applications.createApplication(payload)).id, fixture.id);
});

test("delete targets the selected account id, never the signed-in account", async () => {
  global.fetch = async (url, init) => {
    assert.equal(url, "https://api.example.test/api/user/account-a-id");
    assert.equal(init.method, "DELETE");
    assert.equal(init.headers.get("Authorization"), "Bearer access-test");
    return json({ status: true, data: null });
  };

  await users.deleteUser("account-a-id");
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
    { perlu_pdkb: "Tidak", estimasi_tanggal_selesai: "2026-10-15" },
    { perlu_pdkb: false, estimasi_tanggal_selesai: "2026-10-15" },
  ],
  [
    "wo_konstruksi",
    "wo-vendor/konstruksi",
    { perlu_pdkb: "Ya", estimasi_tanggal_selesai: "2026-11-01" },
    { perlu_pdkb: true, estimasi_tanggal_selesai: "2026-11-01" },
  ],
  ["wo_tiang", "wo-vendor/tiang", {}, {}],
  ["wo_app", "wo-vendor/app", {}, {}],
  ["wo_pdkb", "wo-pdkb", {}, {}],
  ["reservasi_material", "reservasi-material", { notes: "Reserve" }, { notes: "Reserve" }],
  ["tera_app", "tera-app", { notes: "Tera" }, { notes: "Tera" }],
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

test("document download uses the dedicated authenticated download endpoint", async () => {
  global.fetch = async (url, init) => {
    // The old /permohonan/{id}/documents/{doc_id} route is gone from the spec.
    assert.equal(
      url,
      "https://api.example.test/api/documents/document-id/download",
    );
    assert.equal(init.method, "GET");
    assert.equal(init.headers.get("Authorization"), "Bearer access-test");
    return new Response("document bytes", {
      headers: { "Content-Type": "application/pdf" },
    });
  };

  const blob = await applications.downloadApplicationDocument("document-id");
  assert.equal(await blob.text(), "document bytes");
});

test("document preview uses the dedicated authenticated preview endpoint", async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      url,
      "https://api.example.test/api/documents/document-id/preview",
    );
    assert.equal(init.headers.get("Authorization"), "Bearer access-test");
    return new Response("preview bytes", {
      headers: { "Content-Type": "application/pdf" },
    });
  };

  const blob = await applications.previewApplicationDocument("document-id");
  assert.equal(await blob.text(), "preview bytes");
});

test("activity export uses the authenticated workflow node endpoint", async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      url,
      "https://api.example.test/api/permohonan/test-id/activities/pemasangan_tiang/export",
    );
    assert.equal(init.method, "GET");
    assert.equal(init.headers.get("Authorization"), "Bearer access-test");
    return new Response("activity pdf", {
      headers: { "Content-Type": "application/pdf" },
    });
  };

  const blob = await applications.exportApplicationActivity(
    "test-id",
    "pemasangan_tiang",
  );
  assert.equal(await blob.text(), "activity pdf");
});

for (const [workflowNode, endpoint] of [
  ["wo_tiang", "tiang"],
  ["wo_konstruksi", "konstruksi"],
  ["wo_app", "app"],
]) {
  test("WO activity export uses the dedicated POST endpoint: " + workflowNode, async () => {
    global.fetch = async (url, init) => {
      assert.equal(
        url,
        "https://api.example.test/api/permohonan/test-id/wo-vendor/" +
          endpoint +
          "/export",
      );
      assert.equal(init.method, "POST");
      assert.equal(init.headers.get("Authorization"), "Bearer access-test");
      return new Response("wo activity pdf", {
        headers: { "Content-Type": "application/pdf" },
      });
    };

    const blob = await applications.exportApplicationActivity(
      "test-id",
      workflowNode,
    );
    assert.equal(await blob.text(), "wo activity pdf");
  });
}

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

function exportSample(overrides = {}) {
  const base = applications.mapApplication(fixture);
  return {
    ...base,
    number: "PBPD-2026-0099",
    customer: "PT Contoh",
    phone: "081234567890",
    location: "Jl. Pahlawan No. 10, Surabaya",
    requestedAt: "2026-09-10",
    ...overrides,
  };
}

test("export rows mirror the list for the role and map SLA to a label", () => {
  const [row] = exporter.buildExportRows(
    [
      exportSample({
        sla: { tone: "late", label: "Terlambat", deadline: "2026-09-12" },
      }),
    ],
    "admin",
  );
  assert.equal(row.number, "PBPD-2026-0099");
  assert.equal(row.requestedAt, "2026-09-10");
  assert.equal(row.stage, "Pra konstruksi");
  assert.equal(row.status, "Menunggu tindakan");
  assert.equal(row.slaStatus, "Terlambat");
  assert.equal(row.slaDeadline, "2026-09-12");
});

test("export marks a returned request with its own stage and no activity", () => {
  const [row] = exporter.buildExportRows(
    [exportSample({ rejected: true, status: "returned" })],
    "admin",
  );
  assert.equal(row.stage, "Delegasi PK NPS");
  assert.equal(row.activity, "");
});

test("export withholds customer contact columns from vendor roles only", () => {
  const headers = (role) =>
    exporter.getExportColumns(role).map((column) => column.header);
  assert.ok(headers("admin").includes("No. HP"));
  assert.ok(headers("admin").includes("Alamat"));
  for (const role of ["vendor-tiang", "vendor-konstruksi", "vendor-sr-app"]) {
    assert.ok(!headers(role).includes("No. HP"));
    assert.ok(!headers(role).includes("Alamat"));
    assert.ok(headers(role).includes("No. Permohonan"));
  }
});

test("export file name carries the date and the right extension", () => {
  const now = new Date(2026, 9, 2);
  assert.equal(
    exporter.exportFileName("xlsx", now),
    "daftar-permohonan-2026-10-02.xlsx",
  );
  assert.equal(
    exporter.exportFileName("pdf", now),
    "daftar-permohonan-2026-10-02.pdf",
  );
});

test("xlsx export produces a real workbook with a header and one row per request", async () => {
  const blob = await exporter.buildApplicationsXlsx(
    [exportSample(), exportSample({ number: "PBPD-2026-0100" })],
    "admin",
  );
  const bytes = new Uint8Array(await blob.arrayBuffer());
  // .xlsx is a zip container.
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
  assert.ok(bytes.length > 1000);
});

test("pdf export produces a real PDF document", async () => {
  const blob = await exporter.buildApplicationsPdf(
    [exportSample(), exportSample({ number: "PBPD-2026-0100" })],
    "admin",
    ["Semua permohonan", 'Pencarian: "razan"'],
    new Date(2026, 9, 2),
  );
  const head = Buffer.from(await blob.arrayBuffer())
    .subarray(0, 5)
    .toString("latin1");
  assert.equal(head, "%PDF-");
});

test("date fields reject yesterday and accept today or later", () => {
  const iso = (offsetDays) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  assert.equal(utils.isDateOnOrAfterToday(iso(-1)), false);
  assert.equal(utils.isDateOnOrAfterToday(iso(0)), true);
  assert.equal(utils.isDateOnOrAfterToday(iso(1)), true);
  assert.equal(utils.isDateOnOrAfterToday("bukan-tanggal"), false);

  const start = utils.startOfToday();
  assert.deepEqual(
    [start.getHours(), start.getMinutes(), start.getSeconds()],
    [0, 0, 0],
  );
  assert.equal(utils.isDateOnOrAfterToday(iso(0)), start <= new Date());
});

test("tarif and daya are read from the top level when the backend sends them", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    jenis_permohonan: "Perubahan Daya (PD)",
    tarif: "bisnis",
    daya_baru: 555000,
    daya_lama: 197000,
  });
  assert.equal(mapped.tarif, "bisnis");
  assert.equal(mapped.dayaBaru, 555000);
  assert.equal(mapped.dayaLama, 197000);
});

test("tarif and daya fall back to the permohonan node payload", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    workflow_nodes: [
      {
        workflow_node: "permohonan",
        stage_number: 1,
        status: "completed",
        payload: { tarif: "rumah_tangga", daya_baru: "2200" },
      },
      ...fixture.workflow_nodes,
    ],
  });
  assert.equal(mapped.tarif, "rumah_tangga");
  // Numeric strings are accepted; a missing daya_lama stays undefined.
  assert.equal(mapped.dayaBaru, 2200);
  assert.equal(mapped.dayaLama, undefined);
});

test("records without tarif or daya map to undefined, never zero or a placeholder", () => {
  const mapped = applications.mapApplication({
    ...fixture,
    daya_baru: 0,
    daya_lama: null,
  });
  assert.equal(mapped.tarif, undefined);
  assert.equal(mapped.dayaBaru, undefined);
  assert.equal(mapped.dayaLama, undefined);
});

test("daya and tarif are formatted for display", () => {
  assert.equal(utils.formatDaya(555000), "555.000 VA");
  assert.equal(utils.formatDaya(450), "450 VA");
  assert.equal(workflow.tarifLabels.rumah_tangga, "Rumah Tangga");
  assert.deepEqual(Object.keys(workflow.tarifLabels), [
    "rumah_tangga",
    "sosial",
    "bisnis",
    "industri",
    "pemerintah",
  ]);
});

test("export carries tarif and daya as labels and digits, empty for old records", () => {
  const [pd, old] = exporter.buildExportRows(
    [
      exportSample({
        requestType: "Perubahan daya",
        tarif: "sosial",
        dayaLama: 900,
        dayaBaru: 1300,
      }),
      exportSample({ tarif: undefined, dayaLama: undefined, dayaBaru: undefined }),
    ],
    "admin",
  );
  assert.equal(pd.tarif, "Sosial");
  assert.equal(pd.dayaLama, "900");
  assert.equal(pd.dayaBaru, "1300");
  assert.equal(old.tarif, "");
  assert.equal(old.dayaLama, "");
  assert.equal(old.dayaBaru, "");
});

test("tarif and daya are internal-only: shown to staff, withheld from vendors, kept in the PDF", () => {
  const headers = (role) =>
    exporter.getExportColumns(role).map((column) => column.header);
  for (const header of ["Tarif", "Daya Lama (VA)", "Daya Baru (VA)"]) {
    assert.ok(headers("admin").includes(header), `admin has ${header}`);
    for (const role of ["vendor-tiang", "vendor-konstruksi", "vendor-sr-app"])
      assert.ok(!headers(role).includes(header), `${role} lacks ${header}`);
  }
  // Contact columns are Excel-only; tarif/daya are not.
  const byHeader = Object.fromEntries(
    exporter.getExportColumns("admin").map((column) => [column.header, column]),
  );
  assert.equal(byHeader["No. HP"].excelOnly, true);
  assert.equal(byHeader["Tarif"].excelOnly, undefined);
  assert.equal(byHeader["Daya Baru (VA)"].number, true);
});

function exportNode(workflow_node, status = "completed") {
  return { workflow_node, stage_number: 4, status, payload: {} };
}

test("internal roles can download every completed activity, and only completed ones", () => {
  const app = applications.mapApplication(fixture);
  for (const role of ["admin", "konstruksi", "perencanaan", "nps", "super-user"]) {
    for (const node of ["survei", "wo_tiang", "wo_konstruksi", "wo_app", "reservasi_material", "pelaksanaan_konstruksi"])
      assert.equal(
        workflow.canExportActivity(role, app, exportNode(node)),
        true,
        `${role} should download ${node}`,
      );
    assert.equal(
      workflow.canExportActivity(role, app, exportNode("wo_tiang", "available")),
      false,
    );
  }
});

test("each vendor downloads only its own work order and the activities it performs", () => {
  const app = applications.mapApplication(fixture); // JTM / Gardu
  const can = (role, node) =>
    workflow.canExportActivity(role, app, exportNode(node));

  // The work order issued to that vendor — but never another vendor's.
  assert.equal(can("vendor-konstruksi", "wo_konstruksi"), true);
  assert.equal(can("vendor-konstruksi", "wo_tiang"), false);
  assert.equal(can("vendor-konstruksi", "wo_app"), false);
  assert.equal(can("vendor-tiang", "wo_tiang"), true);
  assert.equal(can("vendor-tiang", "wo_konstruksi"), false);
  assert.equal(can("vendor-sr-app", "wo_app"), true);
  assert.equal(can("vendor-sr-app", "wo_konstruksi"), false);

  // Activities the vendor performs itself.
  assert.equal(can("vendor-konstruksi", "reservasi_material"), true);
  assert.equal(can("vendor-konstruksi", "pelaksanaan_konstruksi"), true);
  assert.equal(can("vendor-tiang", "pemasangan_tiang"), true);

  // Internal activities and unknown nodes stay off-limits to vendors.
  assert.equal(can("vendor-konstruksi", "survei"), false);
  assert.equal(can("vendor-konstruksi", "wo_pdkb"), false);
  assert.equal(can("vendor-konstruksi", "node_tidak_dikenal"), false);

  // Not completed yet -> no report, even for its own work order.
  assert.equal(
    workflow.canExportActivity("vendor-konstruksi", app, exportNode("wo_konstruksi", "available")),
    false,
  );
});

test("SR/APP installation belongs to vendor SR/APP on JTR/JTM but to vendor konstruksi on PLG TM", () => {
  const jtm = applications.mapApplication(fixture);
  const plgTm = { ...jtm, connectionType: "PLG TM <5 GWNG" };
  const node = exportNode("pemasangan_sr_app");
  assert.equal(workflow.canExportActivity("vendor-sr-app", jtm, node), true);
  assert.equal(workflow.canExportActivity("vendor-konstruksi", jtm, node), false);
  assert.equal(workflow.canExportActivity("vendor-konstruksi", plgTm, node), true);
  assert.equal(workflow.canExportActivity("vendor-sr-app", plgTm, node), false);
});

test("WO APP is downloaded by the vendor that installs the SR/APP for the connection type", () => {
  const jtm = applications.mapApplication(fixture); // JTM / Gardu
  const plgTm = { ...jtm, connectionType: "PLG TM <5 GWNG" };
  const woApp = exportNode("wo_app");

  assert.equal(workflow.canExportActivity("vendor-sr-app", jtm, woApp), true);
  assert.equal(workflow.canExportActivity("vendor-konstruksi", jtm, woApp), false);
  // PLG TM: vendor konstruksi takes over SR/APP, so the WO APP is theirs.
  assert.equal(workflow.canExportActivity("vendor-konstruksi", plgTm, woApp), true);
  assert.equal(workflow.canExportActivity("vendor-sr-app", plgTm, woApp), false);
  // The fixed work orders do not depend on the connection type.
  assert.equal(workflow.canExportActivity("vendor-konstruksi", plgTm, exportNode("wo_konstruksi")), true);
  assert.equal(workflow.canExportActivity("vendor-tiang", plgTm, exportNode("wo_tiang")), true);
});

test("only the owning team generates a work order; every other role downloads it", () => {
  const app = applications.mapApplication(fixture);
  const generates = (role, activityId) =>
    workflow.canGenerateWorkOrder(role, app, activityId);

  // Owners: Perencanaan (WO tiang), Konstruksi (WO konstruksi), Transaksi Energi (WO APP).
  assert.equal(generates("perencanaan", "6"), true);
  assert.equal(generates("konstruksi", "7"), true);
  assert.equal(generates("transaksi-energi", "8"), true);

  // Not the owner of that specific WO.
  assert.equal(generates("konstruksi", "6"), false);
  assert.equal(generates("perencanaan", "7"), false);
  for (const role of ["admin", "nps", "teknik", "jaringan", "super-user", "vendor-tiang", "vendor-konstruksi", "vendor-sr-app"])
    for (const id of ["6", "7", "8"])
      assert.equal(generates(role, id), false, `${role} must not generate WO ${id}`);

  // A non-WO activity is never a work order, even for its own owner.
  assert.equal(workflow.isWorkOrderActivity("12"), false);
  assert.equal(generates("vendor-konstruksi", "12"), false);
  assert.equal(workflow.isWorkOrderActivity(undefined), false);
  assert.deepEqual(["6", "7", "8"].map(workflow.isWorkOrderActivity), [true, true, true]);
});

test("the WO file is the newest generated PDF on the WO node, never hand-uploaded evidence", () => {
  const doc = (id, node, source, addedAt) => ({
    id,
    name: `${id}.pdf`,
    actionId: workflow.nodeActions[node],
    addedAt,
    mimeType: "application/pdf",
    sizeBytes: 1,
    source,
  });
  const documents = [
    doc("bukti-upload", "wo_konstruksi", "uploaded", "2026-10-04"),
    doc("wo-lama", "wo_konstruksi", "generated", "2026-10-01"),
    doc("wo-baru", "wo_konstruksi", "generated", "2026-10-03"),
    doc("wo-tiang", "wo_tiang", "generated", "2026-10-02"),
    doc("survei-doc", "survei", "generated", "2026-10-05"),
  ];
  assert.equal(workflow.getWorkOrderFile(documents, "7").id, "wo-baru");
  assert.equal(workflow.getWorkOrderFile(documents, "6").id, "wo-tiang");
  // No generated file yet for WO APP -> nothing to download.
  assert.equal(workflow.getWorkOrderFile(documents, "8"), undefined);
  // Only an uploaded file on the node is not a work order.
  assert.equal(
    workflow.getWorkOrderFile([doc("x", "wo_app", "uploaded", "2026-10-01")], "8"),
    undefined,
  );
  // Selecting must not reorder the caller's list.
  assert.deepEqual(documents.map((item) => item.id), [
    "bukti-upload", "wo-lama", "wo-baru", "wo-tiang", "survei-doc",
  ]);
});

test("document list keeps the source so a generated WO can be told from evidence", async () => {
  global.fetch = async () =>
    json({
      status: true,
      data: [
        {
          id: "d1",
          original_filename: "wo-konstruksi.pdf",
          created_at: "2026-10-03T01:00:00Z",
          mime_type: "application/pdf",
          size_bytes: 10,
          workflow_nodes: ["wo_konstruksi"],
          uploaded_by_name: "konstruksi.up",
          source: "generated",
        },
        {
          id: "d2",
          original_filename: "foto.jpg",
          created_at: "2026-10-03T02:00:00Z",
          mime_type: "image/jpeg",
          size_bytes: 20,
          workflow_nodes: ["wo_konstruksi"],
          source: "uploaded",
        },
      ],
    });
  const mapped = await applications.getApplicationDocuments("test-id");
  assert.deepEqual(mapped.map((item) => item.source), ["generated", "uploaded"]);
  assert.equal(workflow.getWorkOrderFile(mapped, "7").id, "d1");
});
