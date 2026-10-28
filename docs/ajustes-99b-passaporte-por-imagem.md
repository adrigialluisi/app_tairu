# Ajuste 99b — Passaporte reconhecido por imagem

Origem: pedido da Adriana em 27/out/2026. Commit: `ajuste 99b: passaporte reconhecido por imagem`.

No teste pelo celular, o participante manda a foto do passaporte do kit (`Kit_Teste_Usabilidade/passaporte-exemplo.jpg`) pela galeria. Ela chega com outro nome (`IMG_0002.jpg`) e comprimida pelo WhatsApp, igual às notas e aos vouchers do ajuste 96.

1. **Arquivo do kit no app:** `passaporte-exemplo.jpg` copiado para `public/mock-vouchers/`, ao lado do `.png`, e cadastrado pelo nome no mock de documentos. Nos dois formatos, o nome é reconhecido sem diferenciar maiúsculas.
2. **Reconhecimento por contexto em Documentos:** qualquer imagem ou PDF enviado num documento do tipo **Passaporte** preenche o passaporte de exemplo: PARTICIPANTE DO TESTE, XX0000000, Brasil, emissão 10/03/2017 e validade **10/03/2027**.
   - A tela mostra a mesma faixa verde de sempre: "Preenchemos os campos com o que lemos do arquivo. Confira antes de salvar."
   - Os campos preenchidos ficam destacados por 3 s, como nos outros formulários.
   - Os outros tipos seguem a mesma regra, cada um com o seu exemplo.
   - A foto do passaporte enviada num documento de outro tipo usa o exemplo daquele tipo.
3. **"Me avisar" continua sendo escolha da pessoa:** o arquivo nunca preenche o lembrete. O campo segue com o padrão do formulário até ela trocar.
4. **Código:**
   - A leitura de documentos saiu de `src/data/mockVouchers.ts` para `src/data/mockDocuments.ts`, um módulo puro com imports só de tipo. O `mockVouchers.ts` reexporta `readDocumentFile`, então o `DocumentForm` não mudou.
   - Testes em `src/data/mockDocuments.test.ts`:
     - `IMG_0002.jpg` → validade 10/03/2027;
     - o `.jpg` do kit é reconhecido pelo nome;
     - o arquivo nunca traz o lembrete;
     - o passaporte enviado como CNH vira a CNH de exemplo.
