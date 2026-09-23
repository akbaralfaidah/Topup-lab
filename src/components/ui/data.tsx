import type { ReactNode } from "react";

export function Table({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: { id: string; cells: ReactNode[] }[];
}) {
  return (
    <table className="ui-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {row.cells.map((cell, index) => (
              <td key={columns[index]} data-label={columns[index]}>
                <span className="ui-cell-label" aria-hidden="true">
                  {columns[index]}
                </span>
                <span>{cell}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function PageContainer({
  children,
  width = "content",
}: {
  children: ReactNode;
  width?: "content" | "reading" | "checkout" | "admin";
}) {
  return <div className={`ui-container ui-container-${width}`}>{children}</div>;
}
export function ResponsiveGrid({ children }: { children: ReactNode }) {
  return <div className="ui-grid">{children}</div>;
}
