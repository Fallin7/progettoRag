# Progetto RAG

## Introduzione

Questo repository contiene il backend (BE) e il frontend (FE) di un sistema basato su architettura **RAG (Retrieval-Augmented Generation)**, progettato per consentire l'interrogazione di documentazione aziendale attraverso modelli linguistici di grandi dimensioni (LLM).

L'obiettivo del sistema è fornire risposte contestualizzate e affidabili sfruttando una base documentale indicizzata in un database vettoriale, riducendo il rischio di allucinazioni tipicamente associato ai modelli generativi.

---

# Architettura

Il backend è stato progettato per supportare sia modelli LLM eseguiti localmente sia modelli accessibili tramite API esterne. L'architettura è modulare e suddivisa in tre componenti principali.

## Documents Module

Il modulo **Documents** si occupa dell'intero ciclo di gestione dei documenti caricati dagli utenti:

- Upload e validazione dei file.
- Estrazione del contenuto testuale dai documenti supportati.
- Pulizia e normalizzazione del testo.
- Suddivisione del contenuto in chunk ottimizzati per il retrieval.
- Gestione dei metadati associati ai documenti.

Durante il processo di chunking vengono preservate, ove possibile, le informazioni di contesto e la struttura logica del documento per migliorare la qualità del recupero delle informazioni. La generazione dei chunk viene effettuata mantenendo una sovrapposizione di caratteri tra segmenti consecutivi, al fine di preservare il contesto semantico e migliorare l'efficacia delle operazioni di retrieval.

## Indexing Module

Il modulo **Indexing** è responsabile della costruzione e gestione dell'indice vettoriale.

Le sue principali funzionalità includono:

- Creazione del vector store.
- Caricamento di un indice esistente.
- Generazione degli embedding tramite il modello configurato.
- Inserimento e aggiornamento dei documenti indicizzati.
- Persistenza del database vettoriale.
- Recupero dei documenti più rilevanti tramite similarity search.

## Chat Module

Il modulo **Chat** gestisce l'interazione tra utente e sistema.

Le principali responsabilità sono:

- Gestione delle sessioni di conversazione.
- Memorizzazione dello storico della chat.
- Contestualizzazione delle richieste dell'utente.
- Generazione di domande standalone a partire dalla cronologia conversazionale.
- Recupero dei documenti rilevanti dal vector store.
- Costruzione del prompt finale inviato al modello LLM.
- Generazione della risposta basata sul contesto recuperato.

È inoltre presente un servizio dedicato al preprocessing delle query che consente di migliorare la qualità del retrieval e aumentare la probabilità di recuperare informazioni pertinenti.

---

# Tecnologie Utilizzate

## FAISS

Per la gestione del database vettoriale è stato utilizzato **FAISS (Facebook AI Similarity Search)**, una libreria ottimizzata per la ricerca di similarità ad alte prestazioni.

I principali vantaggi includono:

- Ricerca efficiente su grandi volumi di embedding.
- Supporto a diverse strategie di indicizzazione.
- Elevate prestazioni sia in fase di indicizzazione che di retrieval.
- Possibilità di persistenza locale dell'indice.

## LangChain

**LangChain** viene utilizzato come framework di orchestrazione per la pipeline RAG.

In particolare consente di:

- Gestire i modelli LLM in maniera uniforme.
- Costruire pipeline modulari di retrieval e generazione.
- Implementare catene conversazionali.
- Gestire prompt dinamici.
- Integrare facilmente differenti provider di modelli e sistemi di embedding.

## Large Language Models (LLM)

L'applicazione supporta:

- Modelli locali eseguiti on-premise.
- Modelli cloud accessibili tramite API Key.
- Configurazioni personalizzabili per embedding e generazione.

---

# Preprocessing

## Preprocessing dei Documenti

Dopo l'estrazione del contenuto testuale, vengono applicate diverse operazioni di pulizia:

- Rimozione di caratteri speciali non significativi.
- Normalizzazione degli spazi e della punteggiatura.
- Eliminazione di artefatti derivanti dall'estrazione del testo.
- Applicazione di regole basate su espressioni regolari (Regex).

L'obiettivo è ridurre il rumore informativo e migliorare la qualità degli embedding generati.

## Chunking

I documenti vengono suddivisi in segmenti di dimensione controllata (chunk) per ottimizzare il processo di retrieval.

Le principali best practice adottate includono:

- Dimensione uniforme dei chunk.
- Presenza di overlap tra chunk consecutivi.
- Conservazione del contesto semantico.
- Riduzione della frammentazione delle informazioni.

## Preprocessing delle Query

Prima dell'esecuzione della ricerca vengono applicate alcune trasformazioni alla richiesta dell'utente:

- Espansione di acronimi e abbreviazioni (es. "ML" → "Machine Learning").
- Normalizzazione del testo.
- Rimozione di parole scarsamente informative (stop words).
- Correzione di alcune varianti lessicali comuni.
- Uniformazione di sinonimi e terminologia tecnica.

Queste operazioni consentono di aumentare il recall del sistema di retrieval.

---

# Pipeline di Elaborazione

La sequenza operativa del sistema può essere suddivisa in due macrofasi principali: **Knowledge Base Creation** e **Knowledge Retrieval**.

### Knowledge Base Creation

Questa fase si occupa della preparazione e dell'indicizzazione della base documentale.

1. Caricamento del documento.
2. Estrazione e preprocessing del contenuto testuale.
3. Suddivisione del documento in chunk.
4. Generazione degli embedding per ciascun chunk.
5. Indicizzazione degli embedding all'interno del vector store.

### Knowledge Retrieval

Questa fase viene eseguita a ogni richiesta dell'utente e consente di recuperare le informazioni più rilevanti dalla knowledge base.

1. Ricezione della query utente.
2. Preprocessing della query.
3. Generazione di una domanda standalone a partire dal contesto conversazionale.
4. Recupero (retrieval) dei chunk più rilevanti dal vector store.
5. Costruzione del prompt contestualizzato utilizzando i contenuti recuperati.
6. Generazione della risposta tramite il modello LLM.
7. Restituzione della risposta all'utente.

---

# Gestione dei Casi Limite e Sicurezza

## Query Injection e Prompt Injection

Per mitigare attacchi di Prompt Injection e Query Injection:

- Il prompt di sistema definisce in maniera esplicita il comportamento del modello.
- Le istruzioni provenienti dai documenti recuperati non possono sovrascrivere il prompt di sistema.
- Il modello è istruito a ignorare richieste che tentino di alterare il comportamento previsto dell'applicazione.
- I documenti recuperati vengono trattati esclusivamente come fonte di conoscenza e non come istruzioni operative.

## Gestione delle Risposte Non Supportate

Nel caso in cui il retrieval non restituisca informazioni sufficientemente rilevanti:

- Il sistema limita la generazione di contenuti non supportati.
- Viene privilegiata una risposta che segnali l'assenza di informazioni nel contesto disponibile.
- Si riduce il rischio di allucinazioni del modello.

## Robustezza del Retrieval

L'applicazione delle tecniche di preprocessing, chunking e normalizzazione consente di gestire efficacemente:

- Errori ortografici minori.
- Utilizzo di abbreviazioni.
- Varianti terminologiche.

Questo migliora la capacità del sistema di recuperare contenuti pertinenti anche in presenza di richieste formulate in modo non perfettamente coerente con la documentazione indicizzata.
