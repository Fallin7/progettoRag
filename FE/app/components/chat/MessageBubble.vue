<template>
    <div class="bubble" :class="message.role">
        <p v-if="message.content?.length" class="content">{{ message.content }}</p>
        <span v-else-if="message.role === 'assistant'" class="typing-loader">
            <span></span><span></span><span></span>
        </span>
        <p v-if="message.sources?.length" class="sources">
            📎 {{ message.sources.join(' · ') }}
        </p>
    </div>
</template>

<script setup lang="ts">
import type { Message } from '~/composables/useChat';
defineProps({ message: { type: Object as () => Message, required: true } });
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

.typing-loader {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 0;
}

.typing-loader span {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #aaa;
    animation: typing-bounce 1.2s infinite ease-in-out;
}

.typing-loader span:nth-child(1) {
    animation-delay: 0s;
}

.typing-loader span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-loader span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing-bounce {

    0%,
    60%,
    100% {
        transform: translateY(0);
        opacity: 0.4;
    }

    30% {
        transform: translateY(-6px);
        opacity: 1;
    }
}
</style>
