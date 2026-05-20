<template>
    <div class="upload-box">
        <input ref="fileInput" type="file" accept=".pdf,.txt" style="display:none" @change="handleFile" />
        <button class="btn-upload" @click="fileInput?.click()" :disabled="uploading">
            {{ uploading ? 'Uploading…' : '+ Upload document (PDF / TXT)' }}
        </button>
        <p v-if="lastUploaded" class="success">
            ✓ "{{ lastUploaded.name }}" indexed — {{ lastUploaded.chunks }} chunks
        </p>
        <p v-if="uploadError" class="error">{{ uploadError }}</p>
    </div>
</template>

<script setup lang="ts">
import type { DocumentInfo } from '~/composables/useDocuments';

const emit = defineEmits<{ uploaded: [doc: DocumentInfo] }>();
const config = useRuntimeConfig();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const lastUploaded = ref<DocumentInfo | null>(null);
const uploadError = ref<string | null>(null);

async function handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading.value = true;
    uploadError.value = null;
    lastUploaded.value = null;

    try {
        const formData = new FormData();
        formData.append('file', file);
        const doc = await $fetch<DocumentInfo>(`${config.public.apiBase}/documents/upload`, {
            method: 'POST',
            body: formData,
        });
        lastUploaded.value = doc;
        emit('uploaded', doc);
    } catch (e: unknown) {
        uploadError.value =
            (e as { data?: { message?: string }; message?: string })?.data?.message
            ?? (e as { message?: string })?.message
            ?? 'Upload failed';
    } finally {
        uploading.value = false;
        input.value = '';
    }
}
</script>

<style scoped>
.upload-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.btn-upload {
    padding: 12px 20px;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    width: fit-content;
}

.btn-upload:disabled {
    opacity: 0.5;
    cursor: default;
}

.success {
    color: #16a34a;
    font-size: 0.9rem;
}

.error {
    color: #dc2626;
    font-size: 0.9rem;
}
</style>
