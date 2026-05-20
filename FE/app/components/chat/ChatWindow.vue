<template>
    <div class="chat-window">
        <div class="messages" ref="messagesEl">
            <p v-if="!messages.length" class="empty">Upload a document then start asking questions.</p>
            <MessageBubble v-for="(msg, i) in messages" :key="i" :message="msg" />
            <div v-if="loading" class="bubble assistant loading">Thinking…</div>
        </div>
        <div class="input-row">
            <input v-model="inputText" type="text" placeholder="Ask something about your documents…"
                @keydown.enter="submit" :disabled="loading" />
            <button class="btn-primary" @click="submit" :disabled="loading || !inputText.trim()">Send</button>
            <button class="btn-secondary" @click="$emit('clear')" :disabled="loading">New chat</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useChat';

const props = defineProps<{ messages: Message[]; loading: boolean }>();
const emit = defineEmits<{ send: [text: string]; clear: [] }>();

const inputText = ref('');
const messagesEl = ref<HTMLElement | null>(null);

function submit() {
    if (!inputText.value.trim() || props.loading) return;
    emit('send', inputText.value.trim());
    inputText.value = '';
}

watch(
    () => props.messages.length,
    async () => {
        await nextTick();
        if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    },
);
</script>

<style scoped>
.chat-window {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 100px);
}

.messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 4px;
}

.empty {
    color: #888;
    text-align: center;
    margin-top: 40px;
}

.loading {
    font-style: italic;
    opacity: 0.6;
}

.input-row {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #e0e0e0;
    background: #fff;
}

input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
}

input:focus {
    border-color: #4f46e5;
}

.btn-primary {
    padding: 10px 18px;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: default;
}

.btn-secondary {
    padding: 10px 14px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
}

.btn-secondary:hover {
    background: #e4e4e4;
}
</style>
