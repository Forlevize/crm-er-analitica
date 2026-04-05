import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";

interface TabelaRelatorioProps {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export function TabelaRelatorio({ title, headers, rows }: TabelaRelatorioProps) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, pageSize, title]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, pageSize, rows]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm text-textSecondary">
            Exibindo {rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, rows.length)} de {rows.length} registro(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-textSecondary">Por pagina</span>
            <Select
              className="h-10 min-w-[90px] bg-white"
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="h-10 px-3" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>
              Anterior
            </Button>
            <span className="text-sm font-medium text-textPrimary">
              Pagina {currentPage} de {totalPages}
            </span>
            <Button
              variant="ghost"
              className="h-10 px-3"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Proxima
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <tr>
              {headers.map((header) => (
                <TH key={header}>{header}</TH>
              ))}
            </tr>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <tr>
                <TD colSpan={headers.length} className="py-8 text-center text-textSecondary">
                  Sem resultados para os filtros aplicados.
                </TD>
              </tr>
            ) : null}
            {paginatedRows.map((row, index) => (
              <tr key={`${title}-${index}`} className="transition-colors hover:bg-appBg/60">
                {row.map((cell, cellIndex) => (
                  <TD key={`${title}-${index}-${cellIndex}`}>{cell}</TD>
                ))}
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
