import React, { useState } from 'react';
import { Calendar, Upload, Download, Trash2, Clock } from 'lucide-react';
import { db } from '../database/db';
import { NOW_OVERRIDE_KEY, setNowOverride } from '../utils/now';
import { getDeviceId } from '../lib/device';
import { restoreAllFromCloud } from '../lib/cloudSync';

async function exportJSON(): Promise<Blob> {
  const transactions = await db.transactions.toArray();
  const notes = (await db.notes?.toArray?.()) ?? [];
  const data = { version: 1, exportedAt: new Date().toISOString(), transactions, notes };
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

async function importJSON(file: File) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Archivo inválido');
  if (Array.isArray(data.transactions)) {
    await db.transactions.clear();
    await db.transactions.bulkAdd(data.transactions);
  }
  if (Array.isArray(data.notes) && db.notes) {
    await db.notes.clear();
    await db.notes.bulkAdd(data.notes);
  }
}

export const SettingsPage: React.FC = () => {
  const [simDate, setSimDate] = useState<string>(
    () => localStorage.getItem(NOW_OVERRIDE_KEY) || '',
  );
  const [busy, setBusy] = useState(false);
  const deviceId = getDeviceId();
  const [restoreDeviceId, setRestoreDeviceId] = useState<string>(deviceId);

  const handleExport = async () => {
    const blob = await exportJSON();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await importJSON(file);
      alert('Datos importados correctamente');
    } catch (err) {
      alert('Error al importar: ' + (err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleWipe = async () => {
    if (!confirm('¿Seguro que quieres borrar TODOS los datos locales?')) return;
    await db.delete();
    // Re-construct DB instance by reloading
    location.reload();
  };

  const handleSimDateApply = () => {
    if (simDate) setNowOverride(simDate + 'T12:00:00');
    else setNowOverride(null);
    alert('Fecha simulada aplicada. Recarga si no ves cambios.');
  };

  const handleSimNextMonth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1, 1);
    setSimDate(now.toISOString().slice(0, 10));
    setNowOverride(now.toISOString());
    alert('Simulación del mes siguiente aplicada.');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuración</h2>
      <div className="mb-6 p-3 border border-gray-300 rounded-md bg-yellow-50 text-sm">
        <div className="font-semibold mb-1">Tu device_id</div>
        <div className="font-mono break-all">{deviceId}</div>
      </div>

      {/* Integraciones eliminadas: API key fija en código */}

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Dispositivo</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm break-all">
            <span className="font-mono">{deviceId}</span>
          </div>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(deviceId);
                alert('device_id copiado');
              } catch {
                alert('No se pudo copiar');
              }
            }}
            className="px-3 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-800"
          >
            Copiar device_id
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Copia de seguridad</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4 inline mr-2" /> Exportar JSON
          </button>
          <label className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 cursor-pointer">
            <Upload className="w-4 h-4 inline mr-2" /> Importar JSON
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              hidden
              disabled={busy}
            />
          </label>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Restauración desde la nube</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={restoreDeviceId}
            onChange={(e) => setRestoreDeviceId(e.target.value)}
            placeholder="device_id para restaurar"
            className="px-3 py-2 border border-gray-300 rounded-md w-full"
          />
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await restoreAllFromCloud(restoreDeviceId.trim());
                alert(
                  `Restaurado desde Supabase. Transacciones: ${res.transactions}, Notas: ${res.notes}, Portfolio: ${res.portfolio}, Préstamos: ${res.loans}`,
                );
                location.reload();
              } catch (e) {
                alert('Error al restaurar: ' + (e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Restaurar desde Supabase
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Simulación de fecha</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={simDate}
              onChange={(e) => setSimDate(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={handleSimDateApply}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Aplicar
          </button>
          <button
            onClick={handleSimNextMonth}
            className="px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
          >
            Simular mes siguiente
          </button>
          <button
            onClick={() => {
              setSimDate('');
              setNowOverride(null);
            }}
            className="px-3 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600"
          >
            Quitar simulación
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Datos</h3>
        <button
          onClick={handleWipe}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4 inline mr-2" /> Borrar todos los datos
        </button>
      </section>
    </div>
  );
};
