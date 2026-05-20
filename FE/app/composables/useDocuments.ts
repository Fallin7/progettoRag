export interface DocumentInfo {
  name: string;
  size: number;
  chunks: number;
  uploadedAt: string;
}

export function useDocuments() {
  const documents = ref<DocumentInfo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const config = useRuntimeConfig();

  async function fetchDocuments() {
    loading.value = true;
    error.value = null;
    try {
      documents.value = await $fetch<DocumentInfo[]>(
        `${config.public.apiBase}/documents`,
      );
    } catch (e: unknown) {
      error.value =
        (e as { data?: { message?: string }; message?: string })?.data
          ?.message ??
        (e as { message?: string })?.message ??
        "Failed to fetch documents";
    } finally {
      loading.value = false;
    }
  }

  return { documents, loading, error, fetchDocuments };
}
