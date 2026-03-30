import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Tooltip,
  styled,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Image from "next/image";
import { useSession } from "next-auth/react";

const HiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface ImageUploadFieldProps {
  defaultValue?: string;
  onChange: (url: string) => void;
  mapaId?: string | null;
  label?: string;
  previewWidth?: number;
  previewHeight?: number;
}

const R2_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i;

function isR2Key(value: string) {
  return !!value && R2_KEY_PATTERN.test(value);
}

async function deleteR2KeyIfOwned(value: string) {
  if (!value) return;
  const body = isR2Key(value) ? { key: value } : { url: value };
  fetch("/api/imagens/by-url", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export default function ImageUploadField({
  defaultValue = "",
  onChange,
  mapaId,
  label = "Link da Imagem",
  previewWidth = 280,
  previewHeight = 160,
}: ImageUploadFieldProps) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [url, setUrl] = useState(defaultValue);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastUploadedR2Key = useRef<string | null>(null);

  useEffect(() => {
    if (!url) { setPreviewUrl(null); return; }
    if (!isR2Key(url)) { setPreviewUrl(url); return; }
    let cancelled = false;
    const downloadUrl = `/api/download?key=${encodeURIComponent(url)}${mapaId ? `&mapaId=${encodeURIComponent(mapaId)}` : ''}`;
    fetch(downloadUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) setPreviewUrl(data?.signedUrl ?? null); })
      .catch(() => { if (!cancelled) setPreviewUrl(null); });
    return () => { cancelled = true; };
  }, [url, mapaId]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError("");
    onChange(newUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao obter URL de upload");
      }

      const { signedUrl, uniqueFileName } = await res.json();

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Falha no upload para o R2");

      if (lastUploadedR2Key.current) {
        deleteR2KeyIfOwned(lastUploadedR2Key.current);
      }

      if (mapaId) {
        await fetch("/api/imagens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mapaId,
            nome: file.name,
            caminho: uniqueFileName,
            tamanho: file.size,
          }),
        });
      }

      lastUploadedR2Key.current = uniqueFileName;
      handleUrlChange(uniqueFileName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label={label}
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          fullWidth
          size="small"
          disabled={uploading}
        />
        <Tooltip
          title={!isAuthenticated ? "Entre para fazer upload de imagens" : ""}
          placement="top"
        >
          <span>
            <Button
              component="label"
              variant="outlined"
              size="small"
              disabled={uploading || !isAuthenticated}
              startIcon={
                uploading ? <CircularProgress size={16} /> : <UploadFileIcon />
              }
              sx={{ whiteSpace: "nowrap", minWidth: 130 }}
            >
              {uploading ? "Enviando..." : "Upload"}
              {isAuthenticated && (
                <HiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              )}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      {previewUrl ? (
        <Box sx={{ mt: 1 }}>
          <Image
            src={previewUrl}
            alt="Pré-visualização"
            width={previewWidth}
            height={previewHeight}
            style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
            unoptimized
            onError={() => setError("URL inválida ou imagem inacessível")}
          />
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Cole um link ou faça upload de um arquivo
        </Typography>
      )}
    </Box>
  );
}
