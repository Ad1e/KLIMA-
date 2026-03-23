import { Phone, ShieldAlert, Building2 } from 'lucide-react';

interface EmergencyContact {
  office: string;
  scope: string;
  landline: string;
  mobile: string;
}

const PRIMARY_HOTLINES: EmergencyContact[] = [
  { office: 'Batangas PDRRMO', scope: 'Provincial', landline: '(043) 723-9350', mobile: '0963 367 7425' },
  { office: 'Batangas City CDRRMO', scope: 'City', landline: '(043) 702-3902', mobile: '0999 222 6626' },
  { office: 'Lipa City CDRRMO', scope: 'City', landline: '(043) 756-0127', mobile: '0954 261 4415' },
  { office: 'Tanauan City CDRRMO', scope: 'City', landline: 'N/A', mobile: '0962 117 6261' },
];

const MUNICIPAL_HOTLINES: EmergencyContact[] = [
  { office: 'Balayan MDRRMO', scope: 'Municipality', landline: 'N/A', mobile: '0906 636 4019' },
  { office: 'Balete MDRRMO', scope: 'Municipality', landline: '(043) 756-4123', mobile: '0930 186 0770' },
  { office: 'Cuenca MDRRMO', scope: 'Municipality', landline: 'N/A', mobile: '0917 834 2607' },
  { office: 'Malvar MDRRMO', scope: 'Municipality', landline: '(043) 406-3166', mobile: '0929 305 0514 / 0906 701 9540' },
  { office: 'Nasugbu MDRRMO', scope: 'Municipality', landline: 'N/A', mobile: '0919 629 2599' },
  { office: 'Rosario MDRRMO', scope: 'Municipality', landline: 'N/A', mobile: '0969 643 2583' },
  { office: 'San Jose MDRRMO', scope: 'Municipality', landline: '(043) 786-0816', mobile: 'N/A' },
  { office: 'San Juan MDRRMO', scope: 'Municipality', landline: '0998 590 5102', mobile: '0905 669 9270 (Ambulance)' },
];

const ESSENTIAL_NUMBERS = [
  { office: 'National Emergency Hotline', number: '911' },
  { office: 'BFP Batangas City', number: '425-7163 / 0915 602 1984' },
  { office: 'PNP Batangas City', number: '(043) 723-2030' },
  { office: 'Coast Guard Batangas', number: '0917 842 6633' },
];

export default function HelpSection() {
  return (
    <div className="p-8">
      <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#414042]">Emergency Contacts</h1>
          <p className="mt-1 text-sm text-[#414042]/80">Batangas province hotlines for immediate incident escalation and response</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#d2232a]/35 bg-[#d2232a]/14 px-3 py-2 text-xs font-semibold text-[#911d1f]">
          <ShieldAlert size={14} /> Keep this panel visible during severe weather alerts
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#d2232a]/20 bg-gradient-to-br from-white to-[#d2232a]/12 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/80">Primary Provincial Hotline</p>
          <p className="mt-2 text-lg font-black text-[#414042]">(043) 723-9350</p>
          <p className="text-sm font-semibold text-[#911d1f]">0963 367 7425</p>
        </div>
        <div className="rounded-2xl border border-[#d2232a]/20 bg-gradient-to-br from-white to-[#d2232a]/14 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/80">National Emergency</p>
          <p className="mt-2 text-lg font-black text-[#414042]">911</p>
          <p className="text-sm text-[#414042]/80">24/7 response hotline</p>
        </div>
        <div className="rounded-2xl border border-[#d2232a]/20 bg-gradient-to-br from-white to-[#911d1f]/14 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/80">Emergency Coverage</p>
          <p className="mt-2 text-lg font-black text-[#414042]">Province + Cities + Municipalities</p>
          <p className="text-sm text-[#414042]/80">Use nearest office first, then provincial fallback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-white/96 shadow-[0_20px_55px_rgba(65,64,66,0.1)]">
          <div className="flex items-center justify-between border-b border-[#414042]/15 bg-[#d2232a]/8 px-5 py-4">
            <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#911d1f]">
              <Phone size={14} /> Provincial And Key City Hotlines
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#414042]/70">Priority Contacts</span>
          </div>

          <div className="modern-scrollbar overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-[#414042]/70">Office</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-[#414042]/70">Scope</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-[#414042]/70">Landline</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-[#414042]/70">Mobile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d2232a]/10">
                {PRIMARY_HOTLINES.map((contact) => (
                  <tr key={contact.office} className="hover:bg-[#d2232a]/10">
                    <td className="px-5 py-3 text-xs font-semibold text-[#414042]">{contact.office}</td>
                    <td className="px-5 py-3 text-xs text-[#414042]/80">{contact.scope}</td>
                    <td className="px-5 py-3 text-xs font-medium text-[#414042]">{contact.landline}</td>
                    <td className="px-5 py-3 text-xs font-medium text-[#911d1f]">{contact.mobile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-white/96 shadow-[0_20px_55px_rgba(65,64,66,0.1)]">
          <div className="flex items-center justify-between border-b border-[#414042]/15 bg-[#d2232a]/8 px-5 py-4">
            <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#911d1f]">
              <Building2 size={14} /> Municipal MDRRMO Hotlines
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#414042]/70">Secondary Contacts</span>
          </div>

          <div className="modern-scrollbar max-h-[420px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-[#414042]/70">Office</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-[#414042]/70">Landline</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-[#414042]/70">Mobile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d2232a]/10">
                {MUNICIPAL_HOTLINES.map((contact) => (
                  <tr key={contact.office} className="hover:bg-[#d2232a]/10">
                    <td className="px-5 py-3 text-xs font-semibold text-[#414042]">{contact.office}</td>
                    <td className="px-5 py-3 text-xs text-[#414042]">{contact.landline}</td>
                    <td className="px-5 py-3 text-xs text-[#911d1f]">{contact.mobile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-[#d2232a]/20 bg-white/96 p-5 shadow-[0_16px_45px_rgba(65,64,66,0.08)]">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#911d1f]">Other Essential Numbers</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ESSENTIAL_NUMBERS.map((item) => (
            <div key={item.office} className="rounded-xl border border-[#d2232a]/20 bg-gradient-to-br from-white to-[#d2232a]/10 p-3">
              <p className="text-[11px] font-bold text-[#414042]">{item.office}</p>
              <p className="mt-1 text-sm font-semibold text-[#911d1f]">{item.number}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}



