"use client";

import { buttonClasses } from "@/components/ui/button";
import { deleteContact } from "./actions";

export function DeleteContactButton({
  contactId,
  contactName,
}: {
  contactId: string;
  contactName: string;
}) {
  return (
    <form
      action={deleteContact.bind(null, contactId)}
      onSubmit={(event) => {
        if (!confirm(`Excluir o contato "${contactName}"? Essa ação não pode ser desfeita.`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className={buttonClasses("danger")}>
        Excluir contato
      </button>
    </form>
  );
}
