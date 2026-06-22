<template>
    <div class="page">
        <nav class="navbar">
            <span class="brand">e-CARE Chat</span>
            <div class="links">
                <NuxtLink to="/">Chat</NuxtLink>
            </div>
        </nav>
        <main>
            <ChatWindow :messages="messages" :loading="loading" @send="sendMessage" @clear="clearSession" />
        </main>
    </div>
</template>

<script setup lang="ts">
const { messages, loading, sendMessage, clearSession } = useChat();
</script>

<style scoped>
.page {
    display: flex;
    flex-direction: column;
    height: 100vh;
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

main {
    flex: 1;
    overflow: hidden;
}
</style>
