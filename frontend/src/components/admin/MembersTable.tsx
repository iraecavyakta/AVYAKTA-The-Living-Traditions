"use client";

interface Member {
  id: string;
  name: string;
  domain: string;
  role: string;
  photo_url?: string;
}

interface MembersTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: string | null;
}

const roleLabel = (role: string) =>
  role === "domain_head" ? "Domain Head" : "Member";

export default function MembersTable({
  members,
  onEdit,
  onDelete,
  isDeleting = null,
}: MembersTableProps) {
  return (
    <div className="members-table-container">
      {members.length === 0 ? (
        <div className="empty-state">
          <p>No members in this domain yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="members-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="photo-cell">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="member-photo"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="photo-placeholder">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="name-cell">{member.name}</td>
                  <td className="role-cell">
                    <span
                      className={`role-badge ${
                        member.role === "domain_head" ? "head" : "member"
                      }`}
                    >
                      {roleLabel(member.role)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="actions">
                      <button
                        onClick={() => onEdit(member)}
                        className="btn-edit"
                        disabled={isDeleting === member.id}
                        title="Edit member"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(member.id)}
                        disabled={isDeleting === member.id}
                        className="btn-delete"
                        title="Delete member"
                      >
                        {isDeleting === member.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .members-table-container {
          width: 100%;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: var(--av-olive);
          font-family: var(--font-accent), serif;
          font-style: italic;
          font-size: 14px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .members-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
        }

        .members-table thead tr {
          border-bottom: 1px solid rgba(146, 121, 27, 0.35);
        }

        .members-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .align-right {
          text-align: right;
        }

        .members-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.22);
          color: var(--av-charcoal);
          vertical-align: middle;
        }

        .members-table tbody tr:last-child td {
          border-bottom: none;
        }

        .members-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .members-table tbody tr:hover {
          background-color: rgba(201, 168, 76, 0.08);
        }

        .name-cell {
          font-weight: 500;
        }

        .photo-cell {
          width: 72px;
        }

        .member-photo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(201, 168, 76, 0.6);
        }

        .photo-placeholder {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(146, 121, 27, 0.12);
          border: 2px solid rgba(201, 168, 76, 0.45);
          border-radius: 50%;
          font-family: var(--font-heading), serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--av-bronze);
        }

        .role-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .role-badge.head {
          background: rgba(146, 121, 27, 0.14);
          border: 1px solid rgba(146, 121, 27, 0.45);
          color: var(--av-bronze);
        }

        .role-badge.member {
          background: rgba(27, 94, 59, 0.1);
          border: 1px solid rgba(27, 94, 59, 0.35);
          color: var(--av-emerald);
        }

        .actions-cell {
          text-align: right;
        }

        .actions {
          display: inline-flex;
          gap: 8px;
        }

        .btn-edit,
        .btn-delete {
          padding: 8px 18px;
          border-radius: 999px;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          background: transparent;
          transition:
            transform 0.2s ease,
            background-color 0.2s ease,
            color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .btn-edit {
          border: 1px solid rgba(146, 121, 27, 0.55);
          color: var(--av-bronze);
        }

        .btn-edit:hover:not(:disabled) {
          transform: scale(1.04);
          background: var(--av-bronze);
          color: var(--av-warm);
          box-shadow: 0 6px 18px rgba(146, 121, 27, 0.35);
        }

        .btn-delete {
          border: 1px solid rgba(139, 26, 26, 0.5);
          color: var(--av-crimson);
        }

        .btn-delete:hover:not(:disabled) {
          transform: scale(1.04);
          background: var(--av-crimson);
          color: var(--av-warm);
          box-shadow: 0 6px 18px rgba(139, 26, 26, 0.3);
        }

        .btn-edit:disabled,
        .btn-delete:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .btn-edit,
          .btn-delete,
          .members-table tbody tr {
            transition: none;
          }

          .btn-edit:hover:not(:disabled),
          .btn-delete:hover:not(:disabled) {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .members-table th,
          .members-table td {
            padding: 12px 10px;
            font-size: 12px;
          }

          .actions {
            flex-direction: column;
          }

          .btn-edit,
          .btn-delete {
            padding: 7px 14px;
          }
        }
      `}</style>
    </div>
  );
}
