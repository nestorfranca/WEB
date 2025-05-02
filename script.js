
document.addEventListener("DOMContentLoaded", function() {
  // =============================================
  // PARTE 1: SISTEMA DE LOGIN (AJUSTADO)
  // =============================================
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');

  if (errorMessage) errorMessage.classList.add('hidden');

  const togglePassword = document.getElementById('togglePassword');
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      const passwordInput = document.getElementById('password');
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
      this.style.color = isPassword ? 'var(--primary)' : 'var(--text-light)';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      // Simulação de credenciais - Em um app real, isso viria de um backend
      const validCredentials = [
        { user: "admin", pass: "1234", role: "owner" },
        { user: "cliente", pass: "cliente", role: "client" },
        { user: "funcionario", pass: "abcd", role: "client" } // Funcionario ainda vai para cliente por enquanto
      ];

      if (username === '' || password === '') {
        errorText.textContent = "Por favor, preencha todos os campos";
        errorMessage.classList.remove('hidden');
        return;
      }

      const foundUser = validCredentials.find(cred =>
        cred.user === username && cred.pass === password
      );

      if (foundUser) {
        errorMessage.classList.add('hidden');
        // Salva o tipo de usuário (simplesmente para demonstração, idealmente seria um token)
        localStorage.setItem('userRole', foundUser.role);
        localStorage.setItem('userName', foundUser.user); // Salva nome do usuário

        if (foundUser.role === 'owner') {
          window.location.href = 'dono.html';
        } else {
          window.location.href = 'cliente.html';
        }
      } else {
        errorText.textContent = "Usuário ou senha incorretos";
        errorMessage.classList.remove('hidden');
        document.getElementById('username').classList.add('invalid');
        document.getElementById('password').classList.add('invalid');
        setTimeout(() => {
          document.getElementById('username').classList.remove('invalid');
          document.getElementById('password').classList.remove('invalid');
        }, 3000);
      }
    });
  }

  // =============================================
  // PARTE 2: SISTEMA DE AGENDAMENTO CLIENTE (AJUSTADO)
  // =============================================
  const vehicleSection = document.getElementById('vehicleSection');
  const servicesSection = document.getElementById('servicesSection');
  const scheduleSection = document.getElementById('scheduleSection');
  const progressContainer = document.getElementById('progressContainer');
  const backButton = document.getElementById('backButton');
  const continueBtn = document.getElementById('continueBtn');
  const vehicleCards = document.querySelectorAll('.vehicle-card');
  const serviceOptions = document.querySelectorAll('.service-option');
  const servicesList = document.getElementById('services-list');
  const totalAmount = document.getElementById('total-amount');
  const appointmentDateInput = document.getElementById('appointment-date');
  const timeSlotsContainer = document.getElementById('time-slots');
  const confirmButton = document.getElementById("confirmBtn"); // Corrigido seletor
  // const confirmationModal = document.getElementById('confirmation-modal'); // Duplicado, removeremos um
  const confirmationModalElement = document.querySelectorAll('.confirmation-modal')[0]; // Pega o primeiro modal de confirmação
  const closeModalButton = document.querySelector('.btn-close-modal');
  const closeConfirmationButton = document.getElementById('close-confirmation');

  let selectedVehicle = null;
  let selectedServices = [];
  let totalPrice = 0;
  const MAX_SERVICES = 5;

  // Carrega dados do localStorage ou usa valores padrão
  const loadInitialData = () => {
    const storedAppointments = localStorage.getItem('appointments');
    return storedAppointments ? JSON.parse(storedAppointments) : {};
  };
  let appointments = loadInitialData();

  const vehiclePrices = {
    moto: 25,
    'carro-pequeno': 40,
    'carro-medio': 50,
    'carro-grande': 60,
    suv: 70,
    caminhonete: 80,
    van: 90, // Adicionado
    onibus: 120 // Adicionado
  };

  const vehicleDurations = {
    moto: 30,
    'carro-pequeno': 40,
    'carro-medio': 50,
    'carro-grande': 60,
    suv: 70,
    caminhonete: 80,
    van: 90, // Adicionado (ex: 90 min)
    onibus: 120 // Adicionado (ex: 120 min)
  };

  const serviceData = {
    motor: { name: "Lavar Motor", price: 30, duration: 15 },
    higienizacao: { name: "Higienização Interna", price: 45, duration: 30 },
    "limpeza-ar": { name: "Limpeza Ar Condicionado", price: 40, duration: 20 }, // Adicionado
    enceramento: { name: "Enceramento Premium", price: 60, duration: 25 }, // Nome ajustado
    polimento: { name: "Polimento Cristalizado", price: 90, duration: 35 }, // Nome ajustado
    "protecao-bancos": { name: "Impermeabilização de Bancos", price: 55, duration: 20 }, // Nome ajustado
    "hidratacao-couro": { name: "Hidratação de Couro", price: 50, duration: 20 }, // Adicionado
    "chuva-acida": { name: "Remoção Chuva Ácida", price: 70, duration: 30 } // Adicionado
  };

  function formatMinutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  function saveAppointmentsToStorage() {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }

  // Verifica se estamos na página do cliente para rodar a lógica do cliente
  if (document.body.contains(vehicleSection)) {
    function initClientPage() {
      const today = new Date();
      if (appointmentDateInput) {
          appointmentDateInput.min = today.toISOString().split('T')[0];
      }
      setupClientEventListeners();
      if (document.getElementById('selected-count')) {
        updateServiceCounter();
      }
    }

    function setupClientEventListeners() {
      if (vehicleCards) vehicleCards.forEach(card => card.addEventListener('click', selectVehicle));
      if (serviceOptions) serviceOptions.forEach(option => option.addEventListener('click', toggleService));
      if (backButton) backButton.addEventListener('click', goBack);
      if (continueBtn) continueBtn.addEventListener('click', goToSchedule);
      if (confirmButton) confirmButton.addEventListener('click', confirmAppointmentHandler);
      // Usa o primeiro modal encontrado para fechar e redirecionar
      if (closeModalButton) closeModalButton.addEventListener('click', () => { window.location.href = 'index.html'; });
      if (closeConfirmationButton) closeConfirmationButton.onclick = () => { window.location.href = 'cliente.html'; };
      if (appointmentDateInput) appointmentDateInput.addEventListener('change', loadAvailableTimes);
    }

    function selectVehicle(e) {
      const card = e.currentTarget;
      const vehicleType = card.getAttribute('data-vehicle');
      vehicleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedVehicle = {
        type: vehicleType,
        name: card.querySelector('h3').textContent,
        price: vehiclePrices[vehicleType]
      };
      if (vehicleSection) vehicleSection.style.display = 'none';
      if (servicesSection) servicesSection.style.display = 'block';
      if (progressContainer) progressContainer.style.display = 'block';
      if (backButton) backButton.style.display = 'flex';
      calculateTotal();
      updateProgress(1); // Atualiza progresso para passo 1
    }

    function getTotalDuration() {
      const vehicleDuration = selectedVehicle ? vehicleDurations[selectedVehicle.type] || 0 : 0;
      const servicesDuration = selectedServices.reduce((sum, s) => sum + (serviceData[s.id]?.duration || 0), 0);
      return vehicleDuration + servicesDuration;
    }

    function toggleService(e) {
      const option = e.currentTarget;
      const serviceId = option.getAttribute('data-service');
      const service = serviceData[serviceId];
      if (!service) return; // Proteção caso serviceId não exista

      const index = selectedServices.findIndex(s => s.id === serviceId);

      if (index > -1) {
        selectedServices.splice(index, 1);
        option.classList.remove('selected');
      } else {
        if (selectedServices.length >= MAX_SERVICES) {
          alert(`Você pode selecionar no máximo ${MAX_SERVICES} serviços adicionais.`);
          return;
        }
        selectedServices.push({ id: serviceId, name: service.name, price: service.price });
        option.classList.add('selected');
      }

      updateServiceCounter();
      updateServicesList();
      calculateTotal();
    }

    function goBack() {
      if (servicesSection && servicesSection.style.display === 'block') {
        servicesSection.style.display = 'none';
        if (vehicleSection) vehicleSection.style.display = 'block';
        if (progressContainer) progressContainer.style.display = 'none';
        if (backButton) backButton.style.display = 'none';
        updateProgress(0); // Volta ao estado inicial do progresso
      } else if (scheduleSection && scheduleSection.style.display === 'block') {
        scheduleSection.style.display = 'none';
        if (servicesSection) servicesSection.style.display = 'block';
        updateProgress(1);
      }
    }

    function goToSchedule() {
      if (servicesSection) servicesSection.style.display = 'none';
      if (scheduleSection) scheduleSection.style.display = 'block';
      updateProgress(2);
      updateSummary();
      // Carrega horários disponíveis se a data já estiver selecionada
      if (appointmentDateInput && appointmentDateInput.value) {
          loadAvailableTimes();
      }
    }

    function updateProgress(step) {
        if (!progressContainer) return;
        document.querySelectorAll('.step').forEach((s, i) => {
            const stepNumber = parseInt(s.getAttribute('data-step'), 10);
            s.classList.toggle('active', stepNumber <= step);
        });

        // Atualiza a linha de progresso
        const progressBar = progressContainer.querySelector('.progress-steps::before');
        if (progressBar) { // A pseudo-classe ::before não pode ser manipulada diretamente, requer CSS ou classes
            // Alternativa: Adicionar classes ao container para controlar o estilo da linha
            progressContainer.classList.remove('progress-step-0', 'progress-step-1', 'progress-step-2');
            if (step > 0) {
                progressContainer.classList.add(`progress-step-${step}`);
            }
        }
    }

    function updateServiceCounter() {
      const countElement = document.getElementById('selected-count');
      if (countElement) countElement.textContent = selectedServices.length;
    }

    function updateServicesList() {
      if (!servicesList) return;
      servicesList.innerHTML = '';
      if (selectedServices.length === 0) {
        servicesList.innerHTML = '<li>Nenhum serviço adicional selecionado</li>';
      } else {
        selectedServices.forEach(service => {
          const li = document.createElement('li');
          li.innerHTML = `<span>${service.name}</span><span class="service-price">+R$ ${service.price.toFixed(2)}</span>`;
          servicesList.appendChild(li);
        });
      }
    }

    function calculateTotal() {
      totalPrice = selectedVehicle ? selectedVehicle.price : 0;
      selectedServices.forEach(s => totalPrice += s.price);
      if (totalAmount) totalAmount.textContent = `R$ ${totalPrice.toFixed(2)}`;
    }

    function loadAvailableTimes() {
        if (!appointmentDateInput || !timeSlotsContainer || !selectedVehicle) return;
        const selectedDate = appointmentDateInput.value;
        if (!selectedDate) {
            timeSlotsContainer.innerHTML = '<p class="text-light">Selecione uma data para ver os horários.</p>';
            return;
        }

        const bookedSlotsForDate = appointments[selectedDate]?.bookedTimes || [];
        timeSlotsContainer.innerHTML = '';

        const totalMinutes = getTotalDuration();
        const slotDuration = 30; // Duração de cada slot em minutos
        const slotsNeeded = Math.ceil(totalMinutes / slotDuration);
        const openingTime = 8 * 60; // 8:00 em minutos
        const closingTime = 18 * 60; // 18:00 em minutos (último horário começa às 17:30 para caber)

        let hasAvailableSlots = false;
        for (let slotStart = openingTime; slotStart < closingTime; slotStart += slotDuration) {
            const time = `${Math.floor(slotStart / 60).toString().padStart(2, '0')}:${(slotStart % 60).toString().padStart(2, '0')}`;
            let isAvailable = true;
            let endOfService = slotStart + (slotsNeeded * slotDuration);

            // Verifica se o serviço termina depois do horário de fechamento
            if (endOfService > closingTime + slotDuration) { // Permite terminar às 18:30
                 isAvailable = false;
            }

            // Verifica conflito com horários já agendados
            for (let i = 0; i < slotsNeeded; i++) {
                const checkTimeMinutes = slotStart + i * slotDuration;
                const checkTime = `${Math.floor(checkTimeMinutes / 60).toString().padStart(2, '0')}:${(checkTimeMinutes % 60).toString().padStart(2, '0')}`;
                if (bookedSlotsForDate.includes(checkTime)) {
                    isAvailable = false;
                    break;
                }
            }

            const btn = document.createElement('button');
            btn.textContent = time;
            btn.className = 'time-slot';
            btn.dataset.time = time;

            if (!isAvailable) {
                btn.classList.add('disabled');
                btn.disabled = true;
            } else {
                hasAvailableSlots = true;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    updateSummary(); // Atualiza resumo ao selecionar horário
                });
            }
            timeSlotsContainer.appendChild(btn);
        }
        if (!hasAvailableSlots) {
             timeSlotsContainer.innerHTML = '<p class="text-light">Nenhum horário disponível para esta data e duração.</p>';
        }
    }

    function updateSummary() {
      if (!selectedVehicle) return;
      const summaryVehicle = document.getElementById('summary-vehicle');
      const summaryServices = document.getElementById('summary-services');
      const summaryTotal = document.getElementById('summary-total');
      const timeEstimate = document.getElementById('time-estimate');
      const timeValue = document.getElementById('time-value');
      const selectedTimeSlot = timeSlotsContainer ? timeSlotsContainer.querySelector('.time-slot.selected') : null;
      const selectedTime = selectedTimeSlot ? selectedTimeSlot.dataset.time : "-";

      if (summaryVehicle) summaryVehicle.textContent = `${selectedVehicle.name} (R$ ${selectedVehicle.price.toFixed(2)})`;
      if (summaryServices) {
        summaryServices.innerHTML = selectedServices.length > 0
          ? `<ul>${selectedServices.map(s => `<li>${s.name} (+R$ ${s.price.toFixed(2)})</li>`).join('')}</ul>`
          : '<p class="empty-message">Nenhum serviço adicional</p>';
      }
      if (summaryTotal) summaryTotal.textContent = `R$ ${totalPrice.toFixed(2)}`;
      if (timeEstimate) timeEstimate.style.display = 'flex';
      if (timeValue) timeValue.textContent = formatMinutesToTime(getTotalDuration());

      // Adiciona data e hora ao resumo se selecionados
      const summaryDate = document.getElementById('summary-date');
      const summaryTime = document.getElementById('summary-time');
      if (summaryDate && appointmentDateInput.value) {
          const date = new Date(appointmentDateInput.value + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso
          summaryDate.textContent = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } else if (summaryDate) {
          summaryDate.textContent = "-";
      }
      if (summaryTime) summaryTime.textContent = selectedTime;
    }

    function confirmAppointmentHandler() {
        if (!appointmentDateInput) return;
        const date = appointmentDateInput.value;
        const selectedBtn = timeSlotsContainer ? timeSlotsContainer.querySelector('.time-slot.selected') : null;
        const time = selectedBtn ? selectedBtn.dataset.time : null;
        const userName = localStorage.getItem('userName') || 'Cliente Anônimo'; // Pega nome do usuário

        if (!selectedVehicle) {
            alert('Por favor, selecione um veículo primeiro.');
            return;
        }
        if (!date || !time) {
            alert('Por favor, selecione a data e um horário disponível.');
            return;
        }

        const duration = getTotalDuration();
        const slotsNeeded = Math.ceil(duration / 30);
        const [h, m] = time.split(':').map(Number);
        const startMinutes = h * 60 + m;

        // Cria o objeto do agendamento
        const appointmentId = `app-${Date.now()}`;
        const newAppointment = {
            id: appointmentId,
            date: date,
            time: time,
            client: userName,
            vehicle: selectedVehicle,
            services: selectedServices,
            totalPrice: totalPrice,
            duration: duration,
            status: 'Pendente' // Status inicial
        };

        // Adiciona ao objeto principal de agendamentos
        if (!appointments[date]) {
            appointments[date] = { bookedTimes: [], details: [] };
        }

        // Marca os slots de tempo como ocupados
        for (let i = 0; i < slotsNeeded; i++) {
            const slotMinutes = startMinutes + i * 30;
            const formattedTime = `${Math.floor(slotMinutes / 60).toString().padStart(2, '0')}:${(slotMinutes % 60).toString().padStart(2, '0')}`;
            if (!appointments[date].bookedTimes.includes(formattedTime)) {
                appointments[date].bookedTimes.push(formattedTime);
            }
        }

        // Adiciona os detalhes do agendamento
        appointments[date].details.push(newAppointment);

        // Salva no localStorage
        saveAppointmentsToStorage();

        // Mostra confirmação
        showConfirmationModal(newAppointment);

        // Recarrega os horários disponíveis para refletir o novo agendamento
        loadAvailableTimes();
    }

    // Função de confirmação unificada (remove a duplicada)
    function showConfirmationModal(appointmentDetails) {
      const modal = document.querySelectorAll('.confirmation-modal')[0]; // Usa o primeiro modal
      const detailsContainer = modal.querySelector('#confirmation-details'); // Assume que ambos modais têm esse ID

      if (!modal || !detailsContainer) return;

      const dateObj = new Date(appointmentDetails.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      detailsContainer.innerHTML = `
        <p><strong>Cliente:</strong> ${appointmentDetails.client}</p>
        <p><strong>Veículo:</strong> ${appointmentDetails.vehicle.name}</p>
        <p><strong>Data:</strong> ${formattedDate}</p>
        <p><strong>Hora:</strong> ${appointmentDetails.time}</p>
        <p><strong>Serviços Adicionais:</strong></p>
        ${appointmentDetails.services.length > 0 ? `<ul>${appointmentDetails.services.map(s => `<li>${s.name} (+R$ ${s.price.toFixed(2)})</li>`).join('')}</ul>` : '<p>Nenhum</p>'}
        <p><strong>Duração Estimada:</strong> ${formatMinutesToTime(appointmentDetails.duration)}</p>
        <p class="confirmation-total"><strong>Total:</strong> R$ ${appointmentDetails.totalPrice.toFixed(2)}</p>
      `;

      modal.style.display = 'flex';
    }

    // Inicializa a página do cliente
    initClientPage();
  }

  // =============================================
  // PARTE 3: PAINEL DO DONO (NOVO)
  // =============================================
  const ownerPanel = document.querySelector('.owner-panel');

  // Verifica se estamos na página do dono
  if (ownerPanel) {
    const logoutBtn = document.getElementById('logoutBtn');
    const appointmentsTableBody = document.querySelector('#appointmentsTable tbody');

    function loadAppointmentsForOwner() {
        appointments = loadInitialData(); // Garante que temos os dados mais recentes
        appointmentsTableBody.innerHTML = ''; // Limpa a tabela
        let hasAppointments = false;

        // Ordena as datas
        const sortedDates = Object.keys(appointments).sort();

        sortedDates.forEach(date => {
            const dayAppointments = appointments[date].details;
            if (dayAppointments && dayAppointments.length > 0) {
                 // Ordena agendamentos do dia por hora
                dayAppointments.sort((a, b) => a.time.localeCompare(b.time));

                dayAppointments.forEach(app => {
                    hasAppointments = true;
                    const row = document.createElement('tr');
                    row.dataset.appointmentId = app.id;

                    const formattedDate = new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${app.time}</td>
                        <td>${app.client} (${app.vehicle.name})</td>
                        <td>
                            ${app.services.length > 0 ? app.services.map(s => s.name).join(', ') : 'Lavagem Básica'}
                        </td>
                        <td>R$ ${app.totalPrice.toFixed(2)}</td>
                        <td>
                            <select class="status-select" data-id="${app.id}" data-date="${app.date}">
                                <option value="Pendente" ${app.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                <option value="Concluído" ${app.status === 'Conclído' ? 'selected' : ''}>Concluído</option>
                                <option value="Cancelado" ${app.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </td>
                    `;
                    // Adiciona classe de status inicial
                    const selectElement = row.querySelector('select');
                    updateStatusStyle(selectElement);

                    appointmentsTableBody.appendChild(row);
                });
            }
        });

        if (!hasAppointments) {
            appointmentsTableBody.innerHTML = '<tr><td colspan="6" class="no-appointments">Nenhum agendamento encontrado.</td></tr>';
        }

        // Adiciona event listeners para os selects de status
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', handleStatusChange);
        });
    }

    function handleStatusChange(event) {
        const selectElement = event.target;
        const appointmentId = selectElement.dataset.id;
        const appointmentDate = selectElement.dataset.date;
        const newStatus = selectElement.value;

        // Atualiza o status no objeto 'appointments'
        if (appointments[appointmentDate] && appointments[appointmentDate].details) {
            const appointmentIndex = appointments[appointmentDate].details.findIndex(app => app.id === appointmentId);
            if (appointmentIndex !== -1) {
                appointments[appointmentDate].details[appointmentIndex].status = newStatus;
                saveAppointmentsToStorage(); // Salva a mudança no localStorage
                updateStatusStyle(selectElement); // Atualiza o estilo do select
                console.log(`Status do agendamento ${appointmentId} atualizado para ${newStatus}`);
            } else {
                 console.error("Agendamento não encontrado para atualização de status.");
            }
        } else {
             console.error("Data do agendamento não encontrada para atualização de status.");
        }
    }

    function updateStatusStyle(selectElement) {
        selectElement.classList.remove('status-pendente', 'status-concluido', 'status-cancelado');
        if (selectElement.value === 'Pendente') {
            selectElement.classList.add('status-pendente');
        } else if (selectElement.value === 'Concluído') {
            selectElement.classList.add('status-concluido');
        } else if (selectElement.value === 'Cancelado') {
             selectElement.classList.add('status-cancelado'); // Adicionar estilo se necessário
        }
    }

    function logout() {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      window.location.href = 'index.html';
    }

    // Event Listeners do Painel do Dono
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }

    // Carrega os agendamentos ao carregar a página do dono
    loadAppointmentsForOwner();
  }

});

