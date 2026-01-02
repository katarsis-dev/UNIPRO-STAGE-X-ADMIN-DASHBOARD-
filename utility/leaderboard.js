import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  await verifyUserAndShowName();
  loadLeaderboard();
  loadJuryTables();

  document
    .getElementById("logout-button")
    .addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
});

async function verifyUserAndShowName() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama_lengkap")
    .eq("id", session.user.id)
    .single();

  const nameElement = document.querySelector(".userNameText");
  if (nameElement && profile) {
    nameElement.textContent = profile.nama_lengkap || "Admin";
  }
}

async function loadLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");

  try {
    const { data: leaderboard, error } = await supabase
      .from("klasemen_final")
      .select("*")
      .order("nilai_rata_rata", { ascending: false });

    if (error) throw error;

    tbody.innerHTML = "";

    if (leaderboard.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3">Belum ada data penilaian.</td></tr>`;
      return;
    }

    leaderboard.forEach((row, index) => {
      let rank = index + 1;
      let rankBadge = `<span class="fw-bold text-secondary">#${rank}</span>`;
      let rowClass = "";
      let statusIcon = "";

      if (rank <= 10) {
        rankBadge = `<span class="badge bg-success border border-success rounded-pill px-3">
                        <i class="bi bi-check-circle-fill me-1"></i> #${rank}
                     </span>`;

        rowClass = "qualified-row";

        statusIcon = `<span class="text-success fw-bold ms-2" style="font-size: 0.8em;">(Lolos)</span>`;
      }
      const scoreDisplay = row.nilai_rata_rata
        ? parseFloat(row.nilai_rata_rata).toFixed(2)
        : "0.00";

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr class="${rowClass}">
          <td class="text-center fs-5">${rankBadge}</td>
          <td><h6 class="mb-0 fw-bold">${row.team_name}</h6></td>
          <td class="text-muted">${row.school_name || "-"}</td>
          <td class="text-center">
            <span class="badge bg-info bg-opacity-10 text-info border border-info">${
              row.jumlah_juri
            }</span>
          </td>
          <td class="text-end pe-4">
            <span class="fw-bold fs-4 text-primary">${scoreDisplay}</span>
          </td>
        </tr>
      `
      );
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Gagal: ${err.message}</td></tr>`;
  }
}

async function loadJuryTables() {
  const container = document.getElementById("jury-tables-container");

  try {
    const { data: scoresData, error: errScores } = await supabase
      .from("scores")
      .select("*, participants ( team_name, school_name )");

    if (errScores) throw errScores;

    const { data: juries, error: errJuries } = await supabase
      .from("profiles")
      .select("id, nama_lengkap")
      .eq("role", "juri");

    if (errJuries) throw errJuries;

    container.innerHTML = "";

    if (juries.length === 0) {
      container.innerHTML = `<div class="col-12 alert alert-warning">Tidak ada juri terdaftar.</div>`;
      return;
    }

    juries.forEach((juri) => {
      const juryScores = scoresData.filter((s) => s.judge_id === juri.id);
      let tableContent = "";

      if (juryScores.length === 0) {
        tableContent = `<tr><td colspan="7" class="text-center text-muted py-3">Juri ini belum memberikan nilai.</td></tr>`;
      } else {
        juryScores.forEach((score, idx) => {
          const tName = score.participants?.team_name || "Unknown";
          const final = score.total_score
            ? parseFloat(score.total_score).toFixed(2)
            : "0.00";

          tableContent += `
            <tr>
              <td>${idx + 1}</td>
              <td><span class="fw-bold">${tName}</span></td>
              <td class="text-center text-muted">${score.kriteria_1}</td>
              <td class="text-center text-muted">${score.kriteria_2}</td>
              <td class="text-center text-muted">${score.kriteria_3}</td>
              <td class="text-center text-muted">${score.kriteria_4}</td>
              <td class="text-end fw-bold text-primary">${final}</td>
            </tr>`;
        });
      }

      container.insertAdjacentHTML(
        "beforeend",
        `
        <div class="col-12 col-xl-6 mb-4">
          <div class="card border border-light-subtle shadow-sm h-100">
            <div class="card-header py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0 text-primary">
                <i class="bi bi-person-badge me-2"></i> ${juri.nama_lengkap}
              </h5>
              <span class="badge bg-secondary">${juryScores.length} Tim Dinilai</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-striped mb-0 text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tim</th>
                      <th title="K1" class="text-center">K1</th>
                      <th title="K2" class="text-center">K2</th>
                      <th title="K3" class="text-center">K3</th>
                      <th title="K4" class="text-center">K4</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>${tableContent}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `
      );
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="col-12 alert alert-danger">Error: ${error.message}</div>`;
  }
}
