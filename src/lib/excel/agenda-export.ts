import {
  AGENDA_ATTENDEE_STATUS_LABELS,
  AGENDA_EVENT_STATUS_LABELS,
  AGENDA_EVENT_TYPE_LABELS,
} from "@/types/domain";
import type { AgendaEventWithRelations } from "@/services/agenda";

const HEADER_FILL = "FF07723D";
const HEADER_FONT = "FFFFFFFF";

export async function downloadAgendaExcel(
  events: AgendaEventWithRelations[],
  filename = "agenda-presenca.xlsx",
): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Strategos CRM";
  workbook.created = new Date();

  const eventsSheet = workbook.addWorksheet("Eventos", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  eventsSheet.columns = [
    { header: "Título", key: "title", width: 28 },
    { header: "Data", key: "event_date", width: 12 },
    { header: "Hora", key: "event_time", width: 10 },
    { header: "Tipo", key: "event_type", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Local", key: "location", width: 22 },
    { header: "Bairro", key: "neighborhood", width: 16 },
    { header: "Liderança", key: "leadership", width: 20 },
    { header: "Apoiadores", key: "attendee_count", width: 12 },
    { header: "Confirmados", key: "confirmed_count", width: 12 },
  ];

  const presencaSheet = workbook.addWorksheet("Lista de presença", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  presencaSheet.columns = [
    { header: "Evento", key: "event_title", width: 26 },
    { header: "Data", key: "event_date", width: 12 },
    { header: "Apoiador", key: "supporter_name", width: 24 },
    { header: "Telefone", key: "phone", width: 14 },
    { header: "Bairro", key: "neighborhood", width: 16 },
    { header: "Papel", key: "role", width: 14 },
    { header: "Status", key: "status", width: 14 },
  ];

  for (const sheet of [eventsSheet, presencaSheet]) {
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    });
  }

  for (const ev of events) {
    const attendees = ev.agenda_event_attendees ?? [];
    const confirmed = attendees.filter(
      (a) => a.status === "confirmado" || a.status === "compareceu",
    ).length;

    eventsSheet.addRow({
      title: ev.title,
      event_date: ev.event_date,
      event_time: ev.event_time?.slice(0, 5) ?? "",
      event_type: AGENDA_EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type,
      status: AGENDA_EVENT_STATUS_LABELS[ev.status] ?? ev.status,
      location: ev.location ?? "",
      neighborhood: ev.neighborhood ?? "",
      leadership: ev.leaderships?.name ?? "",
      attendee_count: attendees.length,
      confirmed_count: confirmed,
    });

    for (const a of attendees) {
      presencaSheet.addRow({
        event_title: ev.title,
        event_date: ev.event_date,
        supporter_name: a.supporters?.name ?? "—",
        phone: a.supporters?.phone ?? "",
        neighborhood: a.supporters?.neighborhood ?? "",
        role: a.role,
        status: AGENDA_ATTENDEE_STATUS_LABELS[a.status] ?? a.status,
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
