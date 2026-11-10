body {
  margin: 0;
  background: radial-gradient(ellipse at top, #263d61, #0b1424 55%, #080e19);
  color: #eef4ff;
  font-family: system-ui, Arial, sans-serif;
  min-height: 100vh;
}

main {
  max-width: 1120px;
  margin: auto;
  padding: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 8px 0 18px;
}

.brand {
  font-size: 25px;
  font-weight: 900;
}

.brand span {
  color: #9aafff;
}

.muted {
  color: #a7b7ce;
  font-size: 13px;
}

.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 14px;
}

.panel,
.card {
  background: linear-gradient(145deg, #1b2d49, #14233a);
  border: 1px solid #304765;
  border-radius: 20px;
  padding: 17px;
  box-shadow: 0 14px 35px #0003;
}

.side {
  height: max-content;
  position: sticky;
  top: 12px;
}

.nav {
  display: grid;
  gap: 7px;
  margin-top: 14px;
}

.nav button,
button {
  border: 1px solid #304765;
  background: #263d5e;
  color: #eef4ff;
  padding: 10px 12px;
  border-radius: 12px;
  font: inherit;
  cursor: pointer;
}

.nav button.active,
.primary {
  background: #9aafff;
  color: #111a30;
  border: 0;
  font-weight: 800;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.page {
  display: none;
}

.page.active {
  display: block;
}

.card {
  margin-bottom: 13px;
}

.card h2 {
  font-size: 18px;
  margin: 0 0 8px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.stat {
  background: #0d1a2d;
  border: 1px solid #304765;
  padding: 13px;
  border-radius: 14px;
}

.num {
  font-size: 26px;
  font-weight: 850;
}

input, textarea, select {
  width: 100%;
  padding: 11px;
  border: 1px solid #304765;
  border-radius: 12px;
  background: #0b1729;
  color: #eef4ff;
  font: inherit;
}

textarea {
  min-height: 85px;
  resize: vertical;
}

.row {
  display: flex;
  gap: 8px;
  margin: 9px 0;
  align-items: center;
}

.row > * {
  flex: 1;
  min-width: 0;
}

.list {
  padding: 0;
  list-style: none;
}

.list li,
.entry {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 10px 2px;
  border-bottom: 1px solid #304765;
}

.list li span,
.entry span {
  flex: 1;
}

.clock {
  text-align: center;
  font-size: clamp(55px, 12vw, 85px);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.chat {
  height: 390px;
  overflow: auto;
  background: #091629;
  border: 1px solid #304765;
  border-radius: 14px;
  padding: 12px;
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.msg {
  padding: 10px 13px;
  border-radius: 14px;
  max-width: 90%;
  white-space: pre-wrap;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.bot {
  align-self: flex-end;
  background: #1b304d;
}

.me {
  align-self: flex-start;
  background: #344d70;
}

.notice {
  padding: 10px;
  background: #30291d;
  border: 1px solid #66512d;
  border-radius: 12px;
  color: #ffe0ad;
  font-size: 12px;
  line-height: 1.7;
}

.tiny {
  font-size: 11px;
  color: #a7b7ce;
}

.toolbar {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin: 8px 0;
}

.toolbar button {
  font-size: 12px;
}

.preview {
  max-width: 180px;
  max-height: 130px;
  object-fit: contain;
  border-radius: 10px;
  display: none;
  margin: 8px 0;
}

.entry button {
  flex: 0 0 auto;
}

.status {
  font-size: 12px;
  color: #a7b7ce;
  min-height: 20px;
}

.quizq {
  padding: 12px;
  border: 1px solid #304765;
  border-radius: 12px;
  margin: 9px 0;
  background: #0d1a2d;
}

.bookgrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}

.bookcard {
  background: #0d1a2d;
  border: 1px solid #304765;
  border-radius: 14px;
  padding: 12px;
}

.bookcard a {
  color: #9aafff;
  overflow-wrap: anywhere;
}

.pill {
  display: inline-block;
  border: 1px solid #304765;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  color: #70dfb6;
}

.librarylist {
  display: grid;
  gap: 8px;
}

.libraryitem {
  padding: 12px;
  border: 1px solid #304765;
  border-radius: 12px;
  background: #0d1a2d;
}

.libraryitem small {
  display: block;
  color: #a7b7ce;
  margin-top: 5px;
}

footer {
  text-align: center;
  color: #a7b7ce;
  font-size: 11px;
  padding: 15px;
}

@media (max-width: 720px) {
  main {
    padding: 11px;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .side {
    position: static;
  }

  .nav {
    grid-template-columns: repeat(3, 1fr);
  }

  .nav button {
    font-size: 12px;
    padding: 8px 4px;
  }

  .stats {
    grid-template-columns: 1fr 1fr;
  }

  .chat {
    height: 350px;
  }

  .row {
    flex-wrap: wrap;
  }
}
