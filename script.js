// Simulated user database
const users = [
  { username: "z", password: "z", role: "Ingénieur" },
  { username: "t", password: "t", role: "Technicien" },
  { username: "maint", password: "maintpass", role: "Maintenance" }
];

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    alert("Nom d'utilisateur ou mot de passe incorrect");
    return;
  }

  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('userRole').textContent = user.role;

  if (user.role === 'Technicien') document.getElementById('technicianInterface').classList.remove('hidden');
  if (user.role === 'Ingénieur') document.getElementById('engineerInterface').classList.remove('hidden');

  loadHistory();
}

function logout() {
  location.reload();
}

function navigateTo(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function saveChecklist() {
  const checkboxes = document.querySelectorAll('#checklistForm input[type=checkbox]');
  const comments = document.querySelectorAll('#checklistForm textarea');
  const imageInputs = document.querySelectorAll('#checklistForm input[type="hidden"][name="uploaded_images[]"]');

  const tasks = [...checkboxes].map((el, i) => {
    return {
      step: el.value,
      checked: el.checked,
      comment: comments[i]?.value || '',
      image: imageInputs[i]?.value || null  // Cloudinary URL
    };
  });

  const date = new Date().toLocaleString();
  const data = { date, tasks };

  const history = JSON.parse(localStorage.getItem('linac_history') || '[]');
  history.push(data);
  localStorage.setItem('linac_history', JSON.stringify(history));

  alert('Checklist sauvegardée');
  loadHistory();
}


function loadHistory() {
  const history = JSON.parse(localStorage.getItem('linac_history') || '[]');
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  history.forEach((h, i) => {
    const li = document.createElement('li');
    li.textContent = `${h.date} (${h.tasks.length} étapes)`;
    list.appendChild(li);
  });
}

async function toBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

async function generatePDF() {
  const content = document.getElementById('reportContent');
  content.innerHTML = '';

  const history = JSON.parse(localStorage.getItem('linac_history') || '[]');

  for (const item of history) {
    const div = document.createElement('div');
    div.classList.add('mb-4');

    let tasksHTML = '';
    for (const t of item.tasks) {
      let imgBase64 = '';
      if (t.image) {
        imgBase64 = await toBase64(t.image) || '';
      }

      tasksHTML += `
        <p>- ${t.step}: ${t.checked ? '✔️' : '❌'}<br>
        Commentaire: ${t.comment || '—'}<br>
        ${imgBase64 ? `<img src="${imgBase64}" style="max-width:200px; margin-top:5px;">` : ''}
        </p>
      `;
    }

    div.innerHTML = `<h3 class='font-bold'>${item.date}</h3>${tasksHTML}`;
    content.appendChild(div);
  }

  html2pdf().from(content).save('rapport_linac.pdf');
}


// Your Cloudinary upload code remains the same

const CLOUD_NAME = "dq5fztfqd";
const UPLOAD_PRESET = "justMe";

document.querySelectorAll(".image-upload").forEach(input => {
  input.addEventListener("change", async function () {
    const file = this.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log("Image uploaded to:", data.secure_url);

    // Show uploaded image
    const preview = this.parentElement.querySelector(".uploaded-preview");
    preview.src = data.secure_url;

    // Save URL in hidden input for later use
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "uploaded_images[]";
    hiddenInput.value = data.secure_url;
    this.parentElement.appendChild(hiddenInput);
  });
});
