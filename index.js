import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {
  exportParticipantsToExcel,
  exportSubmissionsToExcel,
} from "./utility/exportExcel.js";
const SUPABASE_URL = "https://fobgtpckfrzotpzjghhi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmd0cGNrZnJ6b3RwempnaGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDc3NDUsImV4cCI6MjA2OTg4Mzc0NX0.kSG6A5qLmAdxNt123az58Yf-jRIa2BSmn296G1mSK04";

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

    if (sessionName.includes("acara")) {
      usernameText.textContent = "Div Acara";
    } else if (sessionName.includes("juri3")) {
      usernameText.textContent = "Juri 3 (Juri)";
    } else if (sessionName.includes("ambanafi")) {
      usernameText.textContent = "Nafiul (Juri)";
    } else if (sessionName.includes("andriano")) {
      usernameText.textContent = "Andri (Juri)";
    } else if (sessionName.includes("sekret")) {
      usernameText.textContent = "KSK/SEKRETARIS";
    }
    console.log("User terotentikasi:", session.user.email);
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

// 5. Panggil fungsi saat halaman selesai dimuat

async function handleStatusClick(button) {
  // Ambil ID dan status dari data-attributes tombol

  const participantId = button.dataset.id;
  const currentStatus = button.dataset.currentStatus === "true"; // Konversi string "true" ke boolean true
  const participantEmail = button.dataset.email;
  const teamName = button.dataset.teamName;
  if (currentStatus) {
    console.log("Status sudah lunas.");
    return;
  }

  // 2. TAMPILKAN BOX KONFIRMASI
  const isConfirmed = confirm(
    "Apakah Anda yakin ingin mengubah status pembayaran peserta ini menjadi LUNAS?\n\nPerubahan ini permanen."
  );

  // 3. JIKA "NO" (false), hentikan fungsi
  if (!isConfirmed) {
    return;
  }

  // 4. JIKA "YES" (true), lanjutkan proses update
  try {
    // Tampilkan indikator loading (opsional)
    button.querySelector(".badge").textContent = "Loading...";
    button.disabled = true;

    // UPDATE SUPABASE
    // Cari baris dengan 'id' yang cocok dan ubah 'payment_status' jadi true
    const { error } = await supabase
      .from("participants")
      .update({ payment_status: true })
      .eq("id", participantId);

    if (error) {
      // Jika Supabase error, lempar error agar ditangkap 'catch'
      throw error;
    }

    try {
      const { error: emailError } = await supabase.functions.invoke(
        "resend-email", // Nama function yang kita deploy
        {
          body: { email: participantEmail, team_name: teamName },
        }
      );

      if (emailError) throw emailError; // Lempar jika email gagal

      // Kalo sukses semua
      alert(
        `Sukses! Status di-update DAN email terkirim ke ${participantEmail}.`
      );
    } catch (emailError) {
      // Kalo cuma email-nya yg gagal
      alert(
        `PERHATIAN: Status BERHASIL di-update, tapi email GAGAL terkirim. Cek log.`
      );
      console.error("Email send error:", emailError);
    }

    // 5. UPDATE FRONTEND (Tampilan)
    // Ambil badge di dalam tombol
    const badge = button.querySelector(".badge");
    badge.classList.remove("bg-warning"); // Hapus class 'pending'
    badge.classList.add("bg-success"); // Tambah class 'lunas'
    badge.textContent = "LUNAS"; // Ubah teks

    // 6. Update data-attribute & pastikan tombol disabled
    button.dataset.currentStatus = "true";
    button.disabled = true;
  } catch (error) {
    console.error("Error update status:", error);
    alert("Gagal mengupdate status: " + error.message);

    // Kembalikan tampilan tombol ke 'Pending' jika gagal
    const badge = button.querySelector(".badge");
    badge.textContent = "Pending";
    badge.classList.remove("bg-success"); // Pastikan tidak ada class sukses
    badge.classList.add("bg-warning"); // Kembalikan class warning
    button.disabled = false; // Aktifkan lagi tombolnya agar bisa dicoba lagi
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadParticipants();
  loadSubmissions();
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
