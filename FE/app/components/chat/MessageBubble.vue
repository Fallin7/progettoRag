<template>
    <div class="bubble" :class="message.role">
        <p class="content">{{ message.content }}</p>
        <p v-if="message.sources?.length" class="sources">
            📎 {{ message.sources.join(' · ') }}
        </p>
    </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useChat';
defineProps<{ message: Message }>();
</script>

<style scoped>
.bubble {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 12px;
    margin-bottom: 8px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}

.user {
    align-self: flex-end;
    background: #4f46e5;
    color: #fff;
    border-bottom-right-radius: 2px;
}

.assistant {
    align-self: flex-start;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-bottom-left-radius: 2px;
}

.sources {
    margin-top: 6px;
    font-size: 0.75rem;
    opacity: 0.7;
}
</style>
