"use client";

import { buttonClasses } from "@/components/ui/button";
import {
  cancelAppointment,
  completeAppointment,
  deleteAppointment,
} from "./actions";

/**
 * Ações destrutivas/de estado do agendamento. Cliente só por causa do confirm()
 * antes de excluir — as mutações em si continuam sendo server actions.
 */
export function AppointmentActionsBar({
  id,
  status,
  title,
}: {
  id: string;
  status: string;
  title: string;
}) {
  const ativo = status === "SCHEDULED";

  return (
    <div className="flex flex-wrap gap-2">
      {ativo && (
        <>
          <form action={completeAppointment.bind(null, id)}>
            <button type="submit" className={buttonClasses("secondary")}>
              Marcar como concluído
            </button>
          </form>
          <form action={cancelAppointment.bind(null, id)}>
            <button type="submit" className={buttonClasses("secondary")}>
              Cancelar reunião
            </button>
          </form>
        </>
      )}

      <form
        action={deleteAppointment.bind(null, id)}
        onSubmit={(event) => {
          if (
            !confirm(`Excluir o agendamento "${title}"? Essa ação não pode ser desfeita.`)
          ) {
            event.preventDefault();
          }
        }}
      >
        <button type="submit" className={buttonClasses("danger")}>
          Excluir
        </button>
      </form>
    </div>
  );
}
