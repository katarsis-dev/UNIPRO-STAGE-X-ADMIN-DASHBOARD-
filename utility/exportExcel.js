export async function exportParticipantsToExcel(db) {
  const exportButton = document.getElementById("export-participant-btn");
  const statusText = document.getElementsByClassName("status-participant")[0];
  
  // Beri tahu user kalau sedang loading
  exportButton.disabled = true;
  statusText.textContent = "Memproses...";

  try {
    // 1. Ambil SEMUA data peserta dari Supabase
    const { data: participants, error } = await db
      .from("participants")
      .select("*")
      .order("registered_at", { ascending: true }); // Urutkan data

    if (error) throw error;

    // 2. Buat Workbook dan Worksheet baru
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Admin Lomba";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Rekap Peserta");

    // 3. Tentukan Kolom dan Header (DI SINI STYLING-NYA)
    // 'key' harus sama dengan properti di data JSON
    sheet.columns = [
      { header: "Nama Tim", key: "team_name", width: 30 },
      { header: "Bukti Pembayaran", key: "payment_photo", width: 40 },
      { header: "Anggota Tim", key: "members_str", width: 40 },
      { header: "Email", key: "email", width: 30 },
      { header: "No. Kontak", key: "contact_number", width: 20 },
      { header: "Asal Sekolah", key: "school_name", width: 35 },
      { header: "Status Pembayaran", key: "status_str", width: 20 },
      { header: "Tgl. Daftar", key: "registered_at_str", width: 25 },
    ];

    // 4. Beri Styling pada Baris Header (Baris 1)
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FF000000" }, size: 12 }; // Font bold, hitam
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }, // Latar belakang abu-abu muda
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" }; // Rata tengah
    headerRow.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin" },
      };
    });

    // 5. Olah data Supabase agar siap dimasukkan ke baris
    const processedData = participants.map((p) => ({
      team_name: p.team_name,
      payment_photo: p.payment_photo,
      members_str: Array.isArray(p.members) ? p.members.join(", ") : "", // Ubah array jadi string
      email: p.email,
      contact_number: p.contact_number,
      school_name: p.school_name,
      status_str: p.payment_status === true ? "Lunas" : "Pending", // Ubah boolean jadi string
      registered_at_str: p.registered_at
        ? new Date(p.registered_at).toLocaleString("id-ID", {
            // Format tanggal
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }));

    // 6. Masukkan data yang sudah diolah ke sheet
    sheet.addRows(processedData);

    // 7. (Opsional) Beri styling pada sel data (misal: rata tengah untuk status)
    sheet.getColumn("status_str").alignment = {
      vertical: "top",
      horizontal: "center",
    };
    sheet.getColumn("contact_number").alignment = {
      vertical: "top",
      horizontal: "left",
    };

    // 8. Buat file dan picu Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Buat link download palsu
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap Peserta Lomba - ${new Date().toLocaleDateString(
      "id-ID"
    )}.xlsx`;

    // Klik link tersebut
    document.body.appendChild(link);
    link.click();

    // Hapus link
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Gagal mengekspor Excel:", error);
    alert("Terjadi kesalahan saat membuat file Excel: " + error.message);
    statusText.textContent = "Error Coba Lagi...";
  } finally {
    // Kembalikan tombol ke keadaan semula
    exportButton.disabled = false;
    statusText.textContent="";
  }
}


export async function exportSubmissionsToExcel(db) {
  const exportButton = document.getElementById("export-submissions-btn");
  const statusText = document.getElementsByClassName("status-submission")[0];
  exportButton.disabled = true;
  statusText.textContent = "Memproses...";

  try {
    // 1. Ambil data submission, "join" dengan nama tim peserta
    const { data: submissions, error } = await db
      .from("submissions")
      .select(
        `
                github_url,
                file_url,
                submitted_at,
                participants (
                    team_name
                )
            `
      )
      .order("submitted_at", { ascending: false }); // Urutkan dari yg terbaru

    if (error) throw error;

    // 2. Buat Workbook dan Worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Admin Lomba";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Rekap Submissions");

    // 3. Tentukan Kolom dan Header (sesuai <thead> kamu)
    sheet.columns = [
      { header: "Nama Tim", key: "team_name", width: 35 },
      { header: "Link Github", key: "github_url", width: 45 },
      { header: "Link File", key: "file_url", width: 45 },
      { header: "Dikumpulkan Pada", key: "submitted_at_str", width: 25 },
    ];

    // 4. Beri Styling pada Baris Header (Baris 1)
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }, // Latar belakang abu-abu
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.eachCell((cell) => {
      cell.border = { bottom: { style: "thin" } };
    });

    // 5. Olah data Supabase agar siap dimasukkan
    const processedData = submissions.map((s) => ({
      // Ambil nama tim dari data 'join'
      team_name: s.participants
        ? s.participants.team_name
        : "Tim Tidak Ditemukan",

      // Masukkan URL (akan dibuat jadi link di langkah 7)
      github_url: s.github_url || "N/A",
      file_url: s.file_url || "N/A",

      // Format tanggal
      submitted_at_str: s.submitted_at
        ? new Date(s.submitted_at).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }));

    // 6. Masukkan data yang sudah diolah ke sheet
    sheet.addRows(processedData);

    // 7. (STYLING TAMBAHAN) Buat Link Github & File bisa diklik
    // 'github_url' adalah kolom B
    sheet.getColumn("B").eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber > 1 && cell.value !== "N/A") {
        // Lewati header & N/A
        cell.value = {
          text: cell.value, // Teks yang tampil adalah URL-nya
          hyperlink: cell.value, // Link-nya adalah URL-nya
        };
        // Beri style standar link (biru, underline)
        cell.font = { color: { argb: "FF0000FF" }, underline: true };
      }
    });

    // 'file_url' adalah kolom C
    sheet.getColumn("C").eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber > 1 && cell.value !== "N/A") {
        cell.value = {
          text: cell.value,
          hyperlink: cell.value,
        };
        cell.font = { color: { argb: "FF0000FF" }, underline: true };
      }
    });

    // 8. Buat file dan picu Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap Submissions - ${new Date().toLocaleDateString(
      "id-ID"
    )}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Gagal mengekspor Excel Submissions:", error);
    alert("Terjadi kesalahan saat membuat file Excel: " + error.message);
    statusText.textContent = "Error Coba lagi";
  } finally {
    // Kembalikan tombol ke keadaan semula
    exportButton.disabled = false;
    statusText.textContent = "";

  }
}