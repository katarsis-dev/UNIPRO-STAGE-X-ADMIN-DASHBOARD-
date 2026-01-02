import { createClient } from "@supabase/supabase-js";
import {
  exportParticipantsToExcel,
  exportSubmissionsToExcel,
} from "./utility/exportExcel.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const usernameText = document.getElementsByClassName("userNameText")[0];

async function checkAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session & (window.location.href != "index.html")) {
    alert("Anda harus login untuk mengakses halaman ini.");
    window.location.href = "bisagasih.html";
  } else {
    let sessionName = session.user.email;

    usernameText.textContent = "Admin";
  }
}

checkAuth();

async function loadSubmissions() {
  const tableBody = document.getElementById("submissions-body");
  if (!tableBody) {
    console.error(
      'Error: <tbody> dengan id="submissions-body" tidak ditemukan.'
    );
    return;
  }
  tableBody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

  try {
    // 2. Request API ke Supabase dengan "JOIN"
    const { data, error } = await supabase.from("submissions").select(`
                github_url,
                file_url,
                submitted_at,
                participants (
                    team_name
                )
            `);

    if (error) {
      throw error;
    }

    // Jika tidak ada data
    if (data.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4">Belum ada data submission.</td></tr>';
      return;
    }

    // Kosongkan tabel sebelum diisi
    tableBody.innerHTML = "";

    // 3. Looping data dan buat baris tabel
    data.forEach((submission) => {
      const row = document.createElement("tr");

      const teamNameCell = document.createElement("td");
      // Cek jika data participants (hasil join) ada
      if (submission.participants && submission.participants.team_name) {
        teamNameCell.textContent = submission.participants.team_name;
      } else {
        teamNameCell.textContent = "Tim Tidak Ditemukan"; // Jika ID peserta tidak (lagi) valid
      }
      row.appendChild(teamNameCell);

      // --- Kolom 2: Link Github ---
      const githubCell = document.createElement("td");
      if (submission.github_url) {
        const githubLink = document.createElement("a");
        githubLink.href = submission.github_url;
        githubLink.textContent = "Lihat Repositori";
        githubLink.target = "_blank"; // Buka di tab baru
        githubLink.rel = "noopener noreferrer"; // Keamanan
        githubCell.appendChild(githubLink);
      } else {
        githubCell.textContent = "N/A";
      }
      row.appendChild(githubCell);

      const fileCell = document.createElement("td");
      if (submission.file_url) {
        const fileLink = document.createElement("a");
        fileLink.href = submission.file_url;
        fileLink.textContent = "Unduh File";
        fileLink.target = "_blank";
        fileLink.rel = "noopener noreferrer";
        fileCell.appendChild(fileLink);
      } else {
        fileCell.textContent = "N/A";
      }
      row.appendChild(fileCell);

      const dateCell = document.createElement("td");
      if (submission.submitted_at) {
        const submissionDate = new Date(submission.submitted_at);
        dateCell.textContent = submissionDate.toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        dateCell.textContent = "N/A";
      }
      row.appendChild(dateCell);

      // Masukkan baris ke tabel
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error mengambil data submission:", err);
    tableBody.innerHTML = `<tr><td colspan="4">Gagal memuat data: ${err.message}</td></tr>`;
  }
}

async function loadParticipants() {
  const tableBody = document.getElementById("participants-body");

  if (!tableBody) {
    console.error(
      'Error: Elemen <tbody> dengan id="participants-body" tidak ditemukan.'
    );
    return;
  }

  tableBody.innerHTML = "";

  try {
    // 3. Request API ke Supabase
    const { data, error } = await supabase.from("participants").select("*");
    document.getElementsByClassName("total_peserta")[0].textContent =
      data.length;
    if (error) {
      console.error("Error mengambil data:", error);
      throw error;
    }
    if (data.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4">Belum ada data Peserta.</td></tr>';
      return;
    }

    data.forEach((participant) => {
      const row = document.createElement("tr");

      const statusCell = document.createElement("td");

      const statusButton = document.createElement("button");
      statusButton.classList.add(
        "btn-status-toggle",
        "border-0",
        "bg-transparent"
      );

      statusButton.dataset.id = participant.id;
      statusButton.dataset.currentStatus = participant.payment_status;
      statusButton.dataset.email = participant.email;
      statusButton.dataset.teamName = participant.team_name;
      const statusBadge = document.createElement("span");
      statusBadge.classList.add("badge");

      if (participant.payment_status === true) {
        statusBadge.classList.add("bg-success");
        statusBadge.textContent = "LUNAS";
        statusButton.disabled = true;
      } else {
        statusBadge.classList.add("bg-warning");
        statusBadge.textContent = "Pending";
        statusButton.disabled = false;
      }

      statusButton.appendChild(statusBadge);
      statusCell.appendChild(statusButton);
      row.appendChild(statusCell);

      const photoCell = document.createElement("td");
      const photoLink = document.createElement("a");
      photoLink.href = participant.payment_photo;
      photoLink.textContent = "Lihat Bukti";
      photoLink.target = "_blank";
      photoCell.appendChild(photoLink);
      row.appendChild(photoCell);

      // Kolom 3: Nama (dari team_name)
      const nameCell = document.createElement("td");
      nameCell.textContent = participant.team_name;
      row.appendChild(nameCell);

      // Kolom 4: Email (dari email)
      const emailCell = document.createElement("td");
      emailCell.textContent = participant.email;
      row.appendChild(emailCell);

      const contactCell = document.createElement("td");
      contactCell.textContent = participant.contact_number;
      row.appendChild(contactCell);

      const memberCell = document.createElement("td");
      const memberList = document.createElement("ul");
      memberList.classList.add("m-0", "p-2");

      participant.members.forEach((member) => {
        const listItem = document.createElement("li");

        listItem.textContent = member;

        memberList.appendChild(listItem);
      });

      memberCell.appendChild(memberList);
      row.appendChild(memberCell);

      // Kolom 6: Asal (dari school_name)
      const schoolCell = document.createElement("td");
      schoolCell.textContent = participant.school_name;
      row.appendChild(schoolCell);

      // Kolom 8: Kode Pos (Contoh: 23-23232)
      const timeRegister = document.createElement("td");
      timeRegister.textContent = participant.registered_at;
      // Ganti N/A dengan data yang sesuai jika ada
      row.appendChild(timeRegister);

      // Masukkan baris baru ke dalam <tbody>
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Terjadi kesalahan:", err.message);
    tableBody.innerHTML = `<tr><td colspan="8">Gagal memuat data: ${err.message}</td></tr>`;
  }
}

async function loadJuryTables() {
  const container = document.getElementById("jury-tables-container");

  try {
    const { data: scoresData, error: errScores } = await supabase.from("scores")
      .select(`
                *,
                participants ( team_name, school_name )
            `);

    if (errScores) throw errScores;

    const { data: juries, error: errJuries } = await supabase
      .from("profiles")
      .select("id, nama_lengkap")
      .eq("role", "juri");

    if (errJuries) throw errJuries;

    container.innerHTML = "";

    if (juries.length === 0) {
      container.innerHTML = `<div class="alert alert-warning">Belum ada juri terdaftar.</div>`;
      return;
    }

    juries.forEach((juri) => {
      const juryScores = scoresData.filter((s) => s.judge_id === juri.id);

      let tableContent = "";

      if (juryScores.length === 0) {
        tableContent = `<tr><td colspan="6" class="text-center text-muted">Juri ini belum memberikan penilaian.</td></tr>`;
      } else {
        juryScores.forEach((score, idx) => {
          const teamName = score.participants
            ? score.participants.team_name
            : "Tim Terhapus";
          const school = score.participants
            ? score.participants.school_name
            : "-";

          const finalScore = score.total_score
            ? parseFloat(score.total_score).toFixed(2)
            : "0.00";

          tableContent += `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>
                                <span class="fw-bold">${teamName}</span><br>
                                <small class="text-muted">${school}</small>
                            </td>
                            <td class="text-center">${score.kriteria_1}</td>
                            <td class="text-center">${score.kriteria_2}</td>
                            <td class="text-center">${score.kriteria_3}</td>
                            <td class="text-center">${score.kriteria_4}</td>
                            <td class="text-end fw-bold text-primary">${finalScore}</td>
                        </tr>
                    `;
        });
      }

      const juryCard = `
                <div class="col-12 col-xl-6 mb-4">
                    <div class="card border-top border-primary border-3 shadow-sm">
                        <div class="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-person-badge-fill me-2"></i> ${juri.nama_lengkap}
                            </h5>
                            <span class="badge bg-primary">${juryScores.length} Tim Dinilai</span>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Tim</th>
                                            <th title="UI/UX (30%)">K1</th>
                                            <th title="Fitur (30%)">K2</th>
                                            <th title="Inovasi (25%)">K3</th>
                                            <th title="Presentasi (15%)">K4</th>
                                            <th class="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tableContent}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      container.insertAdjacentHTML("beforeend", juryCard);
    });
  } catch (error) {
    console.error("Gagal load tabel juri:", error);
    container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

async function handleStatusClick(button) {
  const participantId = button.dataset.id;
  const currentStatus = button.dataset.currentStatus === "true";
  const participantEmail = button.dataset.email;
  const teamName = button.dataset.teamName;
  if (currentStatus) {
    console.log("Status sudah lunas.");
    return;
  }

  const isConfirmed = confirm(
    "Apakah Anda yakin ingin mengubah status pembayaran peserta ini menjadi LUNAS?\n\nPerubahan ini permanen."
  );

  if (!isConfirmed) {
    return;
  }

  try {
    button.querySelector(".badge").textContent = "Loading...";
    button.disabled = true;

    const { error } = await supabase
      .from("participants")
      .update({ payment_status: true })
      .eq("id", participantId);

    if (error) {
      throw error;
    }

    try {
      const { error: emailError } = await supabase.functions.invoke(
        "resend-email",
        {
          body: { email: participantEmail, team_name: teamName },
        }
      );

      if (emailError) throw emailError;

      alert(
        `Sukses! Status di-update DAN email terkirim ke ${participantEmail}.`
      );
    } catch (emailError) {
      alert(
        `PERHATIAN: Status BERHASIL di-update, tapi email GAGAL terkirim. Cek log.`
      );
      console.error("Email send error:", emailError);
    }

    const badge = button.querySelector(".badge");
    badge.classList.remove("bg-warning");
    badge.classList.add("bg-success");
    badge.textContent = "LUNAS";

    button.dataset.currentStatus = "true";
    button.disabled = true;
  } catch (error) {
    console.error("Error update status:", error);
    alert("Gagal mengupdate status: " + error.message);

    const badge = button.querySelector(".badge");
    badge.textContent = "Pending";
    badge.classList.remove("bg-success");
    badge.classList.add("bg-warning");
    button.disabled = false;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadParticipants();
  loadSubmissions();
  loadJuryTables();
  const tableBody = document.getElementById("participants-body");

  const logoutButton = document.getElementById("logout-button");

  if (logoutButton) {
    logoutButton.addEventListener("click", async (event) => {
      event.preventDefault();

      logoutButton.disabled = true;
      logoutButton.textContent = "Logging out...";

      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        window.location.href = "index.html";
      } catch (error) {
        alert("Gagal logout: " + error.message);
        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";
      }
    });
  }

  tableBody.addEventListener("click", (event) => {
    const clickedButton = event.target.closest(".btn-status-toggle");

    if (!clickedButton) {
      return;
    }

    handleStatusClick(clickedButton);
  });

  const exportButton = document.getElementById("export-participant-btn");
  if (exportButton) {
    exportButton.addEventListener("click", () => {
      exportParticipantsToExcel(supabase);
    });
  }

  const exportSubmissionsButton = document.getElementById(
    "export-submissions-btn"
  );
  if (exportSubmissionsButton) {
    exportSubmissionsButton.addEventListener("click", () => {
      exportSubmissionsToExcel(supabase);
    });
  }
});
