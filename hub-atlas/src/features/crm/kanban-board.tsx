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

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function KanbanBoard({ stages: initialStages }: { stages: PipelineBoard }) {
  const [stages, setStages] = useState(initialStages);
  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // coluna sob o cursor, pra dar feedback de onde vai cair
  const [overStageId, setOverStageId] = useState<string | null>(null);

  function handleDrop(targetStageId: string, contactId: string) {
    setStages((prev) => moveContactInBoard(prev, contactId, targetStageId));
    startTransition(() => {
      void moveContact(contactId, targetStageId);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const ativo = overStageId === stage.id;
        return (
          <div
            key={stage.id}
            className={`glass-panel flex w-72 shrink-0 flex-col rounded-2xl transition-colors ${
              ativo ? "border-brand-border bg-brand-subtle/40" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setOverStageId(stage.id);
            }}
            onDragLeave={() => setOverStageId((id) => (id === stage.id ? null : id))}
            onDrop={(event) => {
              event.preventDefault();
              const contactId = event.dataTransfer.getData("text/contact-id");
              if (contactId) handleDrop(stage.id, contactId);
              setDraggingId(null);
              setOverStageId(null);
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="truncate text-sm font-semibold tracking-tight">
                {stage.name}
              </h2>
              <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
                {stage.contacts.length}
              </span>
            </div>

            <div className="flex min-h-28 flex-col gap-2 p-2.5">
              {stage.contacts.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-subtle">
                  Arraste um contato pra cá
                </p>
              ) : (
                stage.contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/dashboard/leads/${contact.id}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/contact-id", contact.id);
                      setDraggingId(contact.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverStageId(null);
                    }}
                    className={`flex cursor-grab items-center gap-2.5 rounded-xl border border-border bg-surface-raised/80 p-2.5 transition-all hover:border-border-strong active:cursor-grabbing ${
                      draggingId === contact.id ? "opacity-40" : ""
                    }`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-sunken text-[0.65rem] font-semibold text-muted">
                      {iniciais(contact.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text">
                        {contact.name}
                      </span>
                      {contact.company && (
                        <span className="block truncate text-xs text-subtle">
                          {contact.company}
                        </span>
                      )}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
