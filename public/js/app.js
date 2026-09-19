document.addEventListener('DOMContentLoaded', () => {

  const dateInput = document.getElementById('update_date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  async function loadTeamDropdowns() {
    try {
      const res = await fetch('/api/teams');
      const teams = await res.json();

      const select = document.getElementById('select_team');
      const selectView = document.getElementById('select_team_view');

      select.innerHTML = '<option value="">Selecione a equipa...</option>';
      selectView.innerHTML = '<option value="">Selecione uma equipa para ver a linha do tempo...</option>';

      teams.forEach(t => {
        const option = `<option value="${t.team_number}">${t.team_number} - ${t.team_name}</option>`;
        select.innerHTML += option;
        selectView.innerHTML += option;
      });
    } catch (err) {
      console.error('Erro ao carregar equipas:', err);
    }
  }
  loadTeamDropdowns();

  document.getElementById('form-cadastrar-equipe').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      team_number: Number(document.getElementById('team_number').value),
      team_name: document.getElementById('team_name').value,
      city_state: document.getElementById('city_state').value,
      robot_name: document.getElementById('robot_name').value
    };

    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert('Equipa cadastrada com sucesso!');
      document.getElementById('form-cadastrar-equipe').reset();
      loadTeamDropdowns();
    } else {
      alert('Erro ao cadastrar equipa.');
    }
  });

  document.getElementById('form-atualizacao').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('team_number', document.getElementById('select_team').value);
    formData.append('update_date', document.getElementById('update_date').value);
    formData.append('title', document.getElementById('title').value);
    formData.append('comment', document.getElementById('comment').value);

    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const res = await fetch('/api/updates', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      alert('Observação e foto salvas no banco!');
      document.getElementById('form-atualizacao').reset();
      document.getElementById('update_date').value = new Date().toISOString().split('T')[0];
    } else {
      alert('Erro ao salvar observação.');
    }
  });

  document.getElementById('select_team_view').addEventListener('change', async (e) => {
    const teamNumber = e.target.value;
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    if (!teamNumber) return;

    const res = await fetch(`/api/teams/${teamNumber}/updates`);
    const updates = await res.json();

    if (updates.length === 0) {
      timeline.innerHTML = '<p style="color: #94a3b8;">Nenhuma observação registada para esta equipa.</p>';
      return;
    }

    updates.forEach(u => {
      const dataFormatada = new Date(u.update_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      timeline.innerHTML += `
        <div class="timeline-card">
          <small>Data: ${dataFormatada}</small>
          <h3>${u.title}</h3>
          <p>${u.comment}</p>
          ${u.image_url ? `<img src="${u.image_url}" alt="Foto do Robô" />` : ''}
        </div>
      `;
    });
  });
});