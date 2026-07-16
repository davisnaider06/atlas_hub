"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moveContact } from "./actions";
import type { PipelineBoard } from "./queries";

function moveContactInBoard(
  board: PipelineBoard,
  contactId: string,
  targetStageId: string,
): PipelineBoard {
  let moved: PipelineBoard[number]["contacts"][number] | undefined;

  const withoutContact = board.map((stage) => {
    const found = stage.contacts.find((c) => c.id === contactId);
    if (found) moved = found;
    return { ...stage, contacts: stage.contacts.filter((c) => c.id !== contactId) };
  });

  if (!moved) return board;

  return withoutContact.map((stage) =>
    stage.id === targetStageId
      ? { ...stage, contacts: [{ ...moved!, stageId: targetStageId }, ...stage.contacts] }
      : stage,
  );
}

export function KanbanBoard({ stages: initialStages }: { stages: PipelineBoard }) {
  const [stages, setStages] = useState(initialStages);
  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDrop(targetStageId: string, contactId: string) {
    setStages((prev) => moveContactInBoard(prev, contactId, targetStageId));
    startTransition(() => {
      void moveContact(contactId, targetStageId);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className="flex w-72 shrink-0 flex-col rounded-lg bg-zinc-100 dark:bg-zinc-900"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const contactId = event.dataTransfer.getData("text/contact-id");
            if (contactId) handleDrop(stage.id, contactId);
            setDraggingId(null);
          }}
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <h2 className="text-sm font-medium">{stage.name}</h2>
            <span className="text-xs text-zinc-500">{stage.contacts.length}</span>
          </div>
          <div className="flex min-h-24 flex-col gap-2 p-2">
            {stage.contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/dashboard/contacts/${contact.id}`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/contact-id", contact.id);
                  setDraggingId(contact.id);
                }}
                onDragEnd={() => setDraggingId(null)}
                className={`rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm transition-opacity hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 ${
                  draggingId === contact.id ? "opacity-50" : ""
                }`}
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{contact.name}</p>
                {contact.company && (
                  <p className="text-xs text-zinc-500">{contact.company}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
