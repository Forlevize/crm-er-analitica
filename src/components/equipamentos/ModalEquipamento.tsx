import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AppUser, EquipamentoVisao } from "@/types";

const schema = z.object({
  serial_number: z.string().min(1, "Informe o serial"),
  equipamento: z.string().min(1, "Informe o tipo"),
  brand: z.string().optional(),
  model: z.string().optional(),
  owner_id: z.string().min(1, "Selecione um owner"),
  ultima_calibracao: z.string().optional(),
  proxima_calibracao: z.string().optional(),
  certificado: z.string().optional(),
  district: z.string().optional(),
  region_state: z.string().optional(),
  city: z.string().optional(),
  customer: z.string().optional(),
  vendor: z.string().optional(),
  observacao: z.string().optional(),
  active: z.enum(["true", "false"]),
});

export type EquipamentoFormValues = z.infer<typeof schema>;

interface ModalEquipamentoProps {
  open: boolean;
  item?: EquipamentoVisao | null;
  owners: AppUser[];
  onClose: () => void;
  onSave: (values: EquipamentoFormValues) => Promise<void> | void;
}

export function ModalEquipamento({ open, item, owners, onClose, onSave }: ModalEquipamentoProps) {
  const form = useForm<EquipamentoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serial_number: "",
      equipamento: "",
      brand: "",
      model: "",
      owner_id: "",
      ultima_calibracao: "",
      proxima_calibracao: "",
      certificado: "",
      district: "",
      region_state: "",
      city: "",
      customer: "",
      vendor: "",
      observacao: "",
      active: "true",
    },
  });

  useEffect(() => {
    form.reset({
      serial_number: item?.serial_number ?? "",
      equipamento: item?.equipamento ?? "",
      brand: item?.brand ?? "",
      model: item?.model ?? "",
      owner_id: item?.owner_id ?? "",
      ultima_calibracao: item?.ultima_calibracao?.slice(0, 10) ?? "",
      proxima_calibracao: item?.proxima_calibracao?.slice(0, 10) ?? "",
      certificado: item?.certificado ?? "",
      district: item?.district ?? "",
      region_state: item?.region_state ?? "",
      city: item?.city ?? "",
      customer: item?.customer ?? "",
      vendor: item?.vendor ?? "",
      observacao: item?.observacao ?? "",
      active: item?.active ? "true" : "false",
    });
  }, [form, item]);

  const fieldClassName =
    "rounded-[26px] border border-marine/12 bg-white/95 p-3 shadow-[0_10px_26px_rgba(0,45,98,0.06)]";
  const labelClassName =
    "mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-marine/78";
  const inputClassName = "h-11 bg-[#fbfcff] shadow-none focus:border-turquoise/50 focus:ring-turquoise/15";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={item ? "Editar equipamento" : "Cadastrar equipamento"}
      description="Todos os status sao calculados automaticamente pela data da proxima calibracao."
      widthClassName="max-w-6xl"
      bodyClassName="px-5 pb-0 pt-4 sm:px-6"
    >
      <form
        className="flex max-h-[74vh] flex-col"
        onSubmit={form.handleSubmit(async (values) => {
          await onSave(values);
          onClose();
        })}
      >
        <div className="overflow-y-auto pb-5 pr-1">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-turquoise" />
                Serial Number
              </label>
              <Input className={inputClassName} {...form.register("serial_number")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-marine" />
                Tipo
              </label>
              <Input className={inputClassName} {...form.register("equipamento")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-veoliaRed" />
                Owner
              </label>
              <Select className={inputClassName} {...form.register("owner_id")}>
                <option value="">Selecione</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-[#8bd0dd]" />
                Marca
              </label>
              <Input className={inputClassName} {...form.register("brand")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-[#ffac00]" />
                Modelo
              </label>
              <Input className={inputClassName} {...form.register("model")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-[#438d42]" />
                Certificado
              </label>
              <Input className={inputClassName} {...form.register("certificado")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-marine" />
                Ultima calibracao
              </label>
              <Input className={inputClassName} type="date" {...form.register("ultima_calibracao")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-veoliaRed" />
                Proxima calibracao
              </label>
              <Input className={inputClassName} type="date" {...form.register("proxima_calibracao")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-[#772583]" />
                Status do equipamento
              </label>
              <Select className={inputClassName} {...form.register("active")}>
                <option value="true">Ativo</option>
                <option value="false">Descontinuado</option>
              </Select>
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-turquoise" />
                District
              </label>
              <Input className={inputClassName} {...form.register("district")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-[#ff6900]" />
                Region/State
              </label>
              <Input className={inputClassName} {...form.register("region_state")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-[#8bd0dd]" />
                City
              </label>
              <Input className={inputClassName} {...form.register("city")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-[#438d42]" />
                Customer
              </label>
              <Input className={inputClassName} {...form.register("customer")} />
            </div>
            <div className={fieldClassName}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-marine" />
                Vendor
              </label>
              <Input className={inputClassName} {...form.register("vendor")} />
            </div>
            <div className={`${fieldClassName} md:col-span-2 xl:col-span-3`}>
              <label className={labelClassName}>
                <span className="h-2 w-2 rounded-full bg-veoliaRed" />
                Obs.
              </label>
              <Textarea
                rows={4}
                className="min-h-[112px] rounded-[22px] border-black/10 bg-[#fbfcff] shadow-none focus:border-turquoise/50 focus:ring-turquoise/15"
                {...form.register("observacao")}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-black/8 bg-[#fbf8f3]/95 py-4">
          <Button type="button" variant="ghost" className="h-10 px-4" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="h-10 px-5">
            Salvar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
