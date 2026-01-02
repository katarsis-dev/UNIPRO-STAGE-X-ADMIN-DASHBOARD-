import { createClient } from "@supabase/supabase-js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  await verifyJuriAccess();
  await loadPenjurianData();

  document
    .getElementById("logout-button")
    .addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
});

async function verifyJuriAccess() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }
  currentUser = session.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama_lengkap")
    .eq("id", currentUser.id)
    .single();

  if (!profile || profile.role !== "juri") {
    alert("Akses Ditolak: Bukan Juri!");
    window.location.href = "dashboard.html";
    return;
  }
  const nameElement = document.querySelector(".userNameText");
  if (nameElement) nameElement.textContent = profile.nama_lengkap || "Juri";
}

async function loadPenjurianData() {
  const tableBody = document.getElementById("scoring-body");
  tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Sedang memuat data...</td></tr>`;

  try {
    const { data: teams } = await supabase
      .from("participants")
      .select("*")
      .order("id");

    const { data: myScores } = await supabase
      .from("scores")
      .select("*")
      .eq("judge_id", currentUser.id);

    tableBody.innerHTML = "";

    teams.forEach((team) => {
      const existing = myScores.find((s) => s.participant_id === team.id);

      const k1 = existing ? existing.kriteria_1 : 0;
      const k2 = existing ? existing.kriteria_2 : 0;
      const k3 = existing ? existing.kriteria_3 : 0;
      const k4 = existing ? existing.kriteria_4 : 0;

      // Rumus Bobot
      const total = k1 * 0.3 + k2 * 0.3 + k3 * 0.25 + k4 * 0.15;

      // UPDATED: team_name & school_name
      const row = `
                <tr>
                    <td>
                        <h6 class="mb-0 fw-bold">${team.team_name}</h6> 
                        <small class="text-muted">${
                          team.school_name || "-"
                        }</small>
                    </td>
                    <td><input type="number" class="form-control input-score" data-id="${
                      team.id
                    }" data-kriteria="1" value="${k1}"></td>
                    <td><input type="number" class="form-control input-score" data-id="${
                      team.id
                    }" data-kriteria="2" value="${k2}"></td>
                    <td><input type="number" class="form-control input-score" data-id="${
                      team.id
                    }" data-kriteria="3" value="${k3}"></td>
                    <td><input type="number" class="form-control input-score" data-id="${
                      team.id
                    }" data-kriteria="4" value="${k4}"></td>
                    <td><span class="fw-bold fs-5 text-primary total-display" id="total-${
                      team.id
                    }">${total.toFixed(2)}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm w-100 btn-save" data-id="${
                          team.id
                        }">
                            <i class="bi bi-save"></i> Simpan
                        </button>
                    </td>
                </tr>
            `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    attachEventListeners();
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="7" class="text-danger">Error: ${error.message}</td></tr>`;
  }
}

function attachEventListeners() {
  document.querySelectorAll(".input-score").forEach((input) => {
    input.addEventListener("input", (e) =>
      calculateTotal(e.target.getAttribute("data-id"))
    );
  });

  document.querySelectorAll(".btn-save").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      saveScoreToSupabase(e.target.getAttribute("data-id"), e.target)
    );
  });
}

function calculateTotal(teamId) {
  const k1 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="1"]`
    ).value || 0
  );
  const k2 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="2"]`
    ).value || 0
  );
  const k3 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="3"]`
    ).value || 0
  );
  const k4 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="4"]`
    ).value || 0
  );

  const hasil = k1 * 0.3 + k2 * 0.3 + k3 * 0.25 + k4 * 0.15;
  document.getElementById(`total-${teamId}`).innerText = hasil.toFixed(2);
}

async function saveScoreToSupabase(teamId, btnElement) {
  const originalContent = btnElement.innerHTML;
  const k1 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="1"]`
    ).value || 0
  );
  const k2 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="2"]`
    ).value || 0
  );
  const k3 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="3"]`
    ).value || 0
  );
  const k4 = parseInt(
    document.querySelector(
      `.input-score[data-id="${teamId}"][data-kriteria="4"]`
    ).value || 0
  );

  const totalWeighted = k1 * 0.3 + k2 * 0.3 + k3 * 0.25 + k4 * 0.15;

  // UI Loading
  btnElement.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving...`;
  btnElement.disabled = true;

  try {
    const { error } = await supabase.from("scores").upsert(
      {
        // FIX PENTING: ID Harus dimasukin biar tau ini nilai siapa!
        participant_id: teamId,
        judge_id: currentUser.id,

        kriteria_1: k1,
        kriteria_2: k2,
        kriteria_3: k3,
        kriteria_4: k4,
        total_score: totalWeighted,
        created_at: new Date(),
      },
      { onConflict: "participant_id, judge_id" }
    );

    if (error) throw error;

    Toastify({
      text: "Nilai tersimpan!",
      duration: 2000,
      style: { background: "#4fbe87" },
    }).showToast();

    btnElement.classList.replace("btn-primary", "btn-success");
    btnElement.innerHTML = `<i class="bi bi-check-lg"></i>`;
  } catch (err) {
    console.error(err);
    alert("Gagal: " + err.message);
    btnElement.innerHTML = originalContent; // Balikin tombol kalau error
  } finally {
    btnElement.disabled = false;
    setTimeout(() => {
      if (btnElement.classList.contains("btn-success")) {
        btnElement.classList.replace("btn-success", "btn-primary");
        btnElement.innerHTML = `<i class="bi bi-save"></i> Simpan`;
      }
    }, 2000);
  }
}
