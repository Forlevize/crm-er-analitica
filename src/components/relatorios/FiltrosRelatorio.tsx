import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AppUser, RelatorioFiltro } from "@/types";

interface FiltrosRelatorioProps {
  filters: RelatorioFiltro;
  owners: AppUser[];
  districts: string[];
  districtDisabled?: boolean;
  onChange: (next: RelatorioFiltro) => void;
}

export function FiltrosRelatorio({ filters, owners, districts, districtDisabled, onChange }: FiltrosRelatorioProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-textSecondary">Data inicio</p>
        <Input
          type="date"
          value={filters.dataInicio ?? ""}
          onChange={(event) => onChange({ ...filters, dataInicio: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-textSecondary">Data fim</p>
        <Input
          type="date"
          value={filters.dataFim ?? ""}
          onChange={(event) => onChange({ ...filters, dataFim: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-textSecondary">Distrito</p>
        <Select
          disabled={districtDisabled}
          value={filters.district ?? "todos"}
          onChange={(event) => onChange({ ...filters, district: event.target.value })}
        >
          <option value="todos">Todos os distritos</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-textSecondary">Owner</p>
        <Select
          value={filters.ownerId ?? "todos"}
          onChange={(event) => onChange({ ...filters, ownerId: event.target.value })}
        >
          <option value="todos">Todos os owners</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.full_name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-textSecondary">Status</p>
        <Select
          value={filters.status ?? "todos"}
          onChange={(event) => onChange({ ...filters, status: event.target.value as RelatorioFiltro["status"] })}
        >
          <option value="todos">Todos os status</option>
          <option value="vencido">Vencido</option>
          <option value="critico">Critico</option>
          <option value="alerta_60">Alerta 60</option>
          <option value="calibrado">Calibrado</option>
          <option value="agendado">Agendado</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-textSecondary">Tipo de e-mail</p>
        <Select
          value={filters.tipoEmail ?? "todos"}
          onChange={(event) => onChange({ ...filters, tipoEmail: event.target.value as RelatorioFiltro["tipoEmail"] })}
        >
          <option value="todos">Todos os e-mails</option>
          <option value="aviso_60">Aviso 60</option>
          <option value="aviso_45">Aviso 45</option>
          <option value="escalonamento_gestor">Escalonamento gestor</option>
          <option value="semanal_lider">Semanal lider</option>
        </Select>
      </div>
    </div>
  );
}
