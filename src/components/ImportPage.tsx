import React, { useMemo, useState } from 'react';
import { extractTextFromImage, parseOcrTextToTransactions, type ParsedTransactionFromOcr } from '../lib/ocr';
import { useTransactions } from '../hooks/useTransactions';
import { Upload, Image, Check, Save, Calendar } from 'lucide-react';

export const ImportPage: React.FC = () => {
  const { addTransaction } = useTransactions();
  const [files, setFiles] = useState<File[]>([]);
  const [ocrTextByFile, setOcrTextByFile] = useState<Record<string, string>>({});
  const [parsed, setParsed] = useState<ParsedTransactionFromOcr[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const now = new Date();
  const defaultMonthIso = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
    setOcrTextByFile({});
    setParsed([]);
  };

  const runOcr = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    const newTexts: Record<string, string> = {};
    for (const file of files) {
      const res = await extractTextFromImage(file);
      newTexts[file.name] = res.text;
    }
    setOcrTextByFile(newTexts);

    // Aggregate text and parse
    const allText = Object.values(newTexts).join('\n\n');
    const tx = parseOcrTextToTransactions(allText, defaultMonthIso);
    setParsed(tx);
    setIsProcessing(false);
  };

  const totalAmount = useMemo(() => parsed.reduce((s, t) => s + (t.type === 'expense' ? t.amount : -t.amount), 0), [parsed]);

  const saveAll = async () => {
    if (parsed.length === 0) return;
    setIsSaving(true);
    try {
      for (const t of parsed) {
        await addTransaction({
          date: t.date,
          type: t.type,
          description: t.description,
          amount: t.amount,
          category: t.category,
        });
      }
      setParsed([]);
      alert('Transacciones guardadas.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Upload className="w-5 h-5"/> Importar desde imágenes</h2>
        <p className="text-sm text-gray-600 mb-3">Sube capturas de tickets/extractos. Detectaremos importes y los asignaremos al mes actual.</p>
        <label className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md cursor-pointer gap-2">
          <Image className="w-4 h-4"/>
          Elegir imágenes
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </label>
        {files.length > 0 && (
          <span className="ml-3 text-sm text-gray-700">{files.length} archivo(s) seleccionado(s)</span>
        )}

        <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
          <Calendar className="w-3 h-3"/> Mes por defecto: {defaultMonthIso}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded-md disabled:opacity-50"
            onClick={runOcr}
            disabled={isProcessing || files.length === 0}
          >{isProcessing ? 'Procesando...' : 'Reconocer OCR'}</button>
        </div>
      </div>

      {Object.keys(ocrTextByFile).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Texto extraído</h3>
          <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto bg-gray-50 p-2 rounded">{Object.entries(ocrTextByFile).map(([name, text]) => `${name}:\n${text}`).join('\n\n')}</pre>
        </div>
      )}

      {parsed.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Check className="w-4 h-4"/> Transacciones detectadas</h3>
          <ul className="divide-y">
            {parsed.map((t, idx) => (
              <li key={idx} className="py-2 text-sm">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{t.description}</div>
                    <div className="text-gray-500">{t.date} · {t.category || 'Otros'}</div>
                  </div>
                  <div className={t.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                    {t.type === 'expense' ? '-' : '+'}{t.amount.toFixed(2)}€
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 text-sm text-gray-600">Total: {(-totalAmount).toFixed(2)}€</div>

          <div className="mt-4">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md inline-flex items-center gap-2 disabled:opacity-50"
              onClick={saveAll}
              disabled={isSaving}
            >
              <Save className="w-4 h-4"/> {isSaving ? 'Guardando...' : 'Guardar transacciones'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 