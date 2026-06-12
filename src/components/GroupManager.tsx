"use client";

import Link from "next/link";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createGroupWithState,
  deleteGroupWithState,
  updateGroupWithState,
  type GroupFormState
} from "@/app/admin/actions";
import type { Group } from "@/lib/types";

const initialState: GroupFormState = {
  status: "idle",
  message: ""
};

function SubmitButton({
  children,
  danger = false
}: {
  children: ReactNode;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={`button ${danger ? "danger" : "secondary"} compact-button`} type="submit" disabled={pending}>
      {children}
    </button>
  );
}

function StateModal({
  state,
  onClose
}: {
  state: GroupFormState;
  onClose: () => void;
}) {
  if (state.status === "idle") return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`modal ${state.status}`}>
        <h3>{state.status === "success" ? "Pronto" : "Calma ai"}</h3>
        <p>{state.message}</p>
        <button className="button" type="button" onClick={onClose}>
          Fechou
        </button>
      </div>
    </div>
  );
}

function CreateGroupForm() {
  const [state, formAction] = useFormState(createGroupWithState, initialState);
  const [modalState, setModalState] = useState<GroupFormState>(initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    setModalState(state);
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <>
      <form ref={formRef} action={formAction} className="form">
        <div className="score-fields">
          <div className="field">
            <label htmlFor="name">Nome do grupo</label>
            <input id="name" name="name" placeholder="Amigos da firma" required />
          </div>
          <div className="field">
            <label htmlFor="slug">Slug do link</label>
            <input id="slug" name="slug" placeholder="amigos-da-firma" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="description">Descricao</label>
          <input id="description" name="description" placeholder="Opcional" />
        </div>
        <button className="button" type="submit">
          <Plus size={17} aria-hidden /> Criar grupo
        </button>
      </form>
      <StateModal state={modalState} onClose={() => setModalState(initialState)} />
    </>
  );
}

function GroupRow({ group }: { group: Group }) {
  const [updateState, updateAction] = useFormState(updateGroupWithState, initialState);
  const [deleteState, deleteAction] = useFormState(deleteGroupWithState, initialState);
  const [modalState, setModalState] = useState<GroupFormState>(initialState);

  useEffect(() => {
    if (updateState.status !== "idle") setModalState(updateState);
  }, [updateState]);

  useEffect(() => {
    if (deleteState.status !== "idle") setModalState(deleteState);
  }, [deleteState]);

  return (
    <tr>
      <td>
        <form action={updateAction} className="group-edit-form">
          <input type="hidden" name="id" value={group.id} />
          <input type="hidden" name="previous_slug" value={group.slug} />
          <div className="field">
            <label htmlFor={`group-name-${group.id}`}>Nome</label>
            <input id={`group-name-${group.id}`} name="name" defaultValue={group.name} required />
          </div>
          <div className="field">
            <label htmlFor={`group-slug-${group.id}`}>Slug</label>
            <input id={`group-slug-${group.id}`} name="slug" defaultValue={group.slug} required />
          </div>
          <div className="field">
            <label htmlFor={`group-description-${group.id}`}>Descricao</label>
            <input
              id={`group-description-${group.id}`}
              name="description"
              defaultValue={group.description ?? ""}
              placeholder="Opcional"
            />
          </div>
          <SubmitButton>
            <Save size={15} aria-hidden /> Salvar
          </SubmitButton>
        </form>
      </td>
      <td>
        <div className="nav">
          <Link className="button secondary compact-button" href={`/grupos/${group.slug}`}>
            <ExternalLink size={16} aria-hidden /> /grupos/{group.slug}
          </Link>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!confirm(`Excluir o grupo ${group.name}? Os jogos ficam sem grupo.`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={group.id} />
            <input type="hidden" name="slug" value={group.slug} />
            <SubmitButton danger>
              <Trash2 size={15} aria-hidden /> Excluir
            </SubmitButton>
          </form>
        </div>
        <StateModal state={modalState} onClose={() => setModalState(initialState)} />
      </td>
    </tr>
  );
}

export function GroupManager({ groups }: { groups: Group[] }) {
  return (
    <>
      <CreateGroupForm />
      {groups.length ? (
        <div className="table-wrap admin-section">
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <GroupRow key={group.id} group={group} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty compact admin-section">Nenhum grupo criado ainda.</div>
      )}
    </>
  );
}
