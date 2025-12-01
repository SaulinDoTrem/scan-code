# 🛡️ Scan Code

Uma extensão completa do Visual Studio Code para análise de segurança de código, combinando detecção de vulnerabilidades em dependências com análise estática de código.

## 📋 Funcionalidades

### 🔍 Análise Estática de Código

Detecta vulnerabilidades comuns no seu código-fonte:

- **SQL Injection**: Identifica concatenação de strings em queries SQL
- **Cross-Site Scripting (XSS)**: Detecta uso inseguro de innerHTML e document.write
- **Command Injection**: Encontra execução de comandos com entrada do usuário
- **Path Traversal**: Identifica operações de arquivo com caminhos não validados
- **Credenciais Hardcoded**: Detecta senhas e tokens no código
- **Criptografia Fraca**: Identifica uso de algoritmos obsoletos (MD5, SHA1, DES, RC4)
- **Uso de eval()**: Detecta código potencialmente perigoso
- **E muito mais...**

### 📦 Análise de Dependências

- Verifica vulnerabilidades conhecidas em pacotes npm, PyPI, Maven, etc.
- Utiliza a base de dados OSV (Open Source Vulnerabilities)
- Análise detalhada com IA (GitHub Copilot ou Ollama)

### 📊 Visualização Interativa

- Dashboard completo com estatísticas de segurança
- Relatório detalhado de vulnerabilidades encontradas
- Severidade classificada (Crítica, Alta, Média, Baixa)
- Recomendações de correção para cada vulnerabilidade

### ⚙️ Configuração Flexível

- Escolha entre GitHub Copilot ou Ollama para análise com IA
- Ative/desative análise estática ou de dependências
- Configure modelos de IA personalizados

## 🚀 Como Usar

### Passo 1: Abrir uma Pasta/Projeto

Antes de começar, você precisa ter um projeto aberto no VS Code:

1. Clique em **Arquivo > Abrir Pasta** (ou `Ctrl+K Ctrl+O`)
2. Selecione a pasta do seu projeto
3. Certifique-se de que o projeto possui um arquivo `package.json` (para Node.js) ou arquivos de configuração de dependências

### Passo 2: Escolher um Comando

A extensão oferece **3 comandos principais**. Para acessá-los:

1. Pressione `Ctrl+Shift+P` (Windows/Linux) ou `Cmd+Shift+P` (Mac)
2. Digite "Scan Code" para ver os comandos disponíveis

---

## 📖 Comandos Disponíveis

### 1️⃣ **Scan Code: Configurações**

**O que faz:** Abre uma tela visual onde você pode configurar como a extensão funciona.

**Quando usar:** Use este comando PRIMEIRO, antes de executar qualquer análise, para configurar:

- **Qual IA usar:**
  - **GitHub Copilot** (requer assinatura paga do GitHub Copilot)
  - **Ollama** (IA gratuita que roda no seu computador)

- **Modelo de IA:**
  - Se escolher Copilot: `claude-sonnet-4.5`, `gpt-4o`, `gpt-4`, ou `o1-preview`
  - Se escolher Ollama: nome do modelo instalado (ex: `llama2`, `codellama`)

- **Tipos de análise:**
  - ✅ Análise de Dependências - verifica se as bibliotecas que você usa têm problemas de segurança
  - ✅ Análise Estática - procura por código inseguro nos seus arquivos

**Passo a passo:**
1. `Ctrl+Shift+P` → digite "Scan Code: Configurações"
2. Escolha entre Copilot ou Ollama
3. Configure as opções
4. Clique em **"💾 Salvar Configurações"**

---

### 2️⃣ **Scan Code: Executar Scan**

**O que faz:** Executa uma análise completa de segurança no seu projeto seguindo as configurações que você definiu.

**Quando usar:** Depois de configurar a extensão, use este comando sempre que quiser verificar se seu código tem vulnerabilidades.

**O que ele analisa:**
- ✅ Dependências do `package.json` (se habilitado)
- ✅ Código-fonte em busca de padrões inseguros (se habilitado)
- ✅ Gera um relatório visual com todas as vulnerabilidades encontradas

**Passo a passo:**
1. Abra seu projeto no VS Code
2. `Ctrl+Shift+P` → digite "Scan Code: Executar Scan"
3. Aguarde a análise (pode levar alguns minutos)
4. Visualize o relatório que abre automaticamente

**Resultado esperado:**
- ✅ Se não houver problemas: mensagem "Nenhuma vulnerabilidade encontrada!"
- ⚠️ Se houver problemas: relatório detalhado com sugestões de correção

---

### 3️⃣ **Scan Code: Executar Análise de Segurança**

**O que faz:** Executa uma análise de segurança completa, similar ao comando anterior.

**Quando usar:** É praticamente igual ao "Executar Scan", apenas com um nome diferente. Use qualquer um dos dois comandos.

**Diferença entre este e o "Executar Scan":**
- Ambos fazem análise completa
- Ambos respeitam as configurações
- Use o que for mais fácil de lembrar!

---

## 🎯 Guia Rápido para Iniciantes

### Se você está começando agora:

1. **Primeiro use:** `Scan Code: Configurações`
   - Configure qual IA usar (recomendo Copilot se você tiver)
   - Deixe marcado para analisar dependências E código estático
   - Salve

2. **Depois use:** `Scan Code: Executar Scan`
   - Espere a análise terminar
   - Leia o relatório
   - Corrija as vulnerabilidades encontradas

3. **Use regularmente:**
   - Sempre que adicionar novas bibliotecas
   - Antes de fazer deploy de uma versão
   - Semanalmente em projetos ativos

---

## ⚙️ Configurações Detalhadas

Esta extensão oferece as seguintes configurações (acessíveis via `Scan Code: Configurações` ou diretamente no `settings.json`):

| Configuração | Tipo | Padrão | Descrição |
|--------------|------|---------|-----------|
| `scanCode.modeloIA` | String | `copilot` | Escolha entre `copilot` ou `ollama` |
| `scanCode.modeloCopilot` | String | `claude-sonnet-4.5` | Modelo do Copilot a usar |
| `scanCode.urlOllama` | String | `http://localhost:11434` | Endereço do servidor Ollama |
| `scanCode.modeloOllama` | String | `llama2` | Nome do modelo Ollama instalado |
| `scanCode.habilitarAnaliseEstatica` | Boolean | `true` | Analisa o código em busca de vulnerabilidades |
| `scanCode.habilitarAnaliseDependencias` | Boolean | `true` | Verifica dependências com problemas |

---

## 📋 Requisitos

- ✅ Visual Studio Code versão 1.85.0 ou superior
- ✅ Um projeto com `package.json` ou outros arquivos de dependências
- ✅ **Para GitHub Copilot:** Assinatura ativa ([saiba mais](https://github.com/features/copilot))
- ✅ **Para Ollama:** Servidor Ollama instalado ([instruções abaixo](#-instalação-do-ollama-opcional))

---

## 🔧 Instalação do Ollama (Opcional)

Se você preferir usar um modelo de IA **gratuito e local** (roda no seu computador):

### Windows/Mac/Linux:

1. **Baixe o Ollama:**
   - Acesse: https://ollama.ai
   - Baixe e instale

2. **Instale um modelo:**
   ```bash
   ollama pull llama2
   ```
   ou
   ```bash
   ollama pull codellama
   ```

3. **Configure na extensão:**
   - Abra `Scan Code: Configurações`
   - Selecione "Ollama"
   - URL: `http://localhost:11434`
   - Modelo: `llama2` (ou o que você instalou)

---

## ❓ Perguntas Frequentes

**P: Preciso pagar alguma coisa?**
R: Não, a extensão é gratuita. Mas se usar Copilot, precisa da assinatura do GitHub Copilot.

**P: O Ollama é grátis?**
R: Sim! Ollama é 100% gratuito e roda localmente no seu computador.

**P: Qual IA é melhor?**
R: Copilot geralmente dá análises mais precisas, mas Ollama é gratuito e não precisa de internet.

**P: A análise demora muito?**
R: Depende do tamanho do projeto. Projetos pequenos: 1-2 minutos. Projetos grandes: 5-10 minutos.

**P: Posso usar sem IA?**
R: Sim! Desabilite "Análise de Dependências" e mantenha apenas "Análise Estática" nas configurações.

---

## 📝 Notas de Versão

### 0.0.1 (Inicial)

- ✨ Análise estática de código implementada
- ✨ Visualização interativa de resultados
- ✨ Painel de configurações
- ✨ Suporte para GitHub Copilot e Ollama
- ✨ Análise de vulnerabilidades em dependências
- ✨ Dashboard com estatísticas de segurança

---

## 🤝 Contribuindo

Encontrou um bug ou tem uma sugestão? Abra uma issue no GitHub!

## 📄 Licença

MIT

**Aproveite e mantenha seu código seguro! 🛡️**
