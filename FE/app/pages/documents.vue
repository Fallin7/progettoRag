<template>
    <div class="page">
        <nav class="navbar">
            <span class="brand">RAG Chat</span>
            <div class="links">
                <NuxtLink to="/">💬 Chat</NuxtLink>
                <NuxtLink to="/documents">📄 Documents</NuxtLink>
            </div>
        </nav>
        <main class="content">
            <h1>Documents</h1>
            <DocumentsDocumentUpload @uploaded="onUploaded" />

            <section class="doc-list">
                <h2>Indexed documents</h2>
                <p v-if="loading" class="muted">Loading…</p>
                <p v-else-if="!documents.length" class="muted">No documents indexed yet.</p>
                <table v-else>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Chunks</th>
                            <th>Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="doc in documents" :key="doc.name + doc.uploadedAt">
                            <td>{{ doc.name }}</td>
                            <td>{{ formatSize(doc.size) }}</td>
                            <td>{{ doc.chunks }}</td>
                            <td>{{ new Date(doc.uploadedAt).toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import type { DocumentInfo } from '~/composables/useDocuments';

const { documents, loading, fetchDocuments } = useDocuments();
onMounted(() => fetchDocuments());

function onUploaded(doc: DocumentInfo) {
    documents.value.push(doc);
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<style scoped>
.page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 52px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
}

.brand {
    font-weight: 700;
    font-size: 1.1rem;
    color: #4f46e5;
}

.links {
    display: flex;
    gap: 20px;
    font-size: 0.95rem;
}

.content {
    padding: 24px 32px;
    max-width: 860px;
}

h1 {
    font-size: 1.6rem;
    margin-bottom: 20px;
}

.doc-list {
    margin-top: 32px;
}

h2 {
    font-size: 1.1rem;
    margin-bottom: 12px;
    color: #555;
}

.muted {
    color: #888;
    font-size: 0.9rem;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

th {
    text-align: left;
    padding: 8px 12px;
    background: #f5f5f5;
    border-bottom: 2px solid #ddd;
}

td {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
}
</style>
