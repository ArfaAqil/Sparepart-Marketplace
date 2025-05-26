member/profile.php
<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'member') {
    header("Location: ../auth.php");
    exit();
}

require_once __DIR__ . '/../data/db.php';

$db = new DB();
$currentUser = $_SESSION['user'];
$tasks = $db->getTasksByAssignee($currentUser['id']);

// Categorize tasks
$successTasks = [];
$failedTasks = [];
$incompleteTasks = [];

foreach ($tasks as $task) {
    if ($task['status'] === 'completed') {
        $score = 0;
        if (!empty($task['feedback'])) {
            $completionFeedbacks = array_filter($task['feedback'], fn($fb) => $fb['type'] === 'completion');
            if (!empty($completionFeedbacks)) {
                $lastFeedback = end($completionFeedbacks);
                $score = $lastFeedback['score'] ?? 0;
            }
        }
        
        if ($score > 0) {
            $successTasks[] = $task;
        } else {
            $failedTasks[] = $task;
        }
    } else {
        $incompleteTasks[] = $task;
    }
}

// Calculate statistics
$totalTasks = count($tasks);
$successCount = count($successTasks);
$failedCount = count($failedTasks);
$incompleteCount = count($incompleteTasks);

// Calculate average score
$averageScore = 0;
$completedTasks = array_merge($successTasks, $failedTasks);
if (!empty($completedTasks)) {
    $totalScore = array_reduce($completedTasks, function($carry, $task) {
        $completionFeedbacks = array_filter($task['feedback'], fn($fb) => $fb['type'] === 'completion');
        $lastFeedback = end($completionFeedbacks);
        return $carry + ($lastFeedback['score'] ?? 0);
    }, 0);
    $averageScore = round($totalScore / count($completedTasks), 1);
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager - Мой профиль</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <link rel="stylesheet" href="/public/assets/css/dashboard.css">
  <link rel="stylesheet" href="/public/assets/css/profile.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="dashboard member-profile">
    <header class="header">
      <div class="logo">
        <i class="fas fa-tasks"></i>
        <h1>Task Manager</h1>
      </div>
      <div class="user-actions">
        <div class="user-profile">
          <img src="https://ui-avatars.com/api/?name=<?= urlencode($currentUser['username']) ?>&background=2575fc&color=fff" alt="<?= htmlspecialchars($currentUser['username']) ?>">
          <span><?= htmlspecialchars($currentUser['username']) ?></span>
        </div>
        <a href="dashboard.php" class="btn-home">
          <i class="fas fa-home"></i> На главную
        </a>
        <a href="../auth.php?logout" class="btn-logout">
          <i class="fas fa-sign-out-alt"></i> Выйти
        </a>
        <button id="theme-toggle" class="theme-toggle">
          <i class="fas fa-moon"></i>
        </button>
      </div>
    </header>

    <main class="profile-content">
      <div class="profile-header">
        <h2><i class="fas fa-user"></i> Мой профиль</h2>
        <div class="profile-stats">
          <div class="stat-card">
            <h3>Успешные</h3>
            <span class="stat-value success"><?= $successCount ?></span>
            <span class="stat-percent"><?= $totalTasks > 0 ? round(($successCount/$totalTasks)*100) : 0 ?>%</span>
          </div>
          <div class="stat-card">
            <h3>Проваленные</h3>
            <span class="stat-value failed"><?= $failedCount ?></span>
            <span class="stat-percent"><?= $totalTasks > 0 ? round(($failedCount/$totalTasks)*100) : 0 ?>%</span>
          </div>
          <div class="stat-card">
            <h3>В работе</h3>
            <span class="stat-value incomplete"><?= $incompleteCount ?></span>
            <span class="stat-percent"><?= $totalTasks > 0 ? round(($incompleteCount/$totalTasks)*100) : 0 ?>%</span>
          </div>
          <div class="stat-card">
            <h3>Рейтинг</h3>
            <span class="stat-value rating"><?= $averageScore ?></span>
            <span class="stat-percent">из 100</span>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas id="tasks-chart"></canvas>
      </div>
      
      <div class="tasks-tabs">
        <button class="tab-btn active" data-tab="success">Успешные (<?= $successCount ?>)</button>
        <button class="tab-btn" data-tab="failed">Проваленные (<?= $failedCount ?>)</button>
        <button class="tab-btn" data-tab="incomplete">В работе (<?= $incompleteCount ?>)</button>
      </div>
      
      <div class="tasks-tab-content active" id="success-tasks-content">
        <?php if ($successCount > 0): ?>
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Дата завершения</th>
                <th>Оценка</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($successTasks as $task): 
                $score = 0;
                $completionDate = '';
                if (!empty($task['feedback'])) {
                  $completionFeedbacks = array_filter($task['feedback'], fn($fb) => $fb['type'] === 'completion');
                  if (!empty($completionFeedbacks)) {
                    $lastFeedback = end($completionFeedbacks);
                    $score = $lastFeedback['score'] ?? 0;
                    $completionDate = $lastFeedback['created_at'] ?? '';
                  }
                }
              ?>
                <tr>
                  <td><?= htmlspecialchars($task['title']) ?></td>
                  <td><?= $completionDate ? date('d.m.Y', strtotime($completionDate)) : '' ?></td>
                  <td><?= $score ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php else: ?>
          <div class="no-tasks">Нет успешных задач</div>
        <?php endif; ?>
      </div>
      
      <div class="tasks-tab-content" id="failed-tasks-content">
        <?php if ($failedCount > 0): ?>
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Дата завершения</th>
                <th>Причина</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($failedTasks as $task): 
                $comment = '';
                $completionDate = '';
                if (!empty($task['feedback'])) {
                  $completionFeedbacks = array_filter($task['feedback'], fn($fb) => $fb['type'] === 'completion');
                  if (!empty($completionFeedbacks)) {
                    $lastFeedback = end($completionFeedbacks);
                    $comment = $lastFeedback['comment'] ?? '';
                    $completionDate = $lastFeedback['created_at'] ?? '';
                  }
                }
              ?>
                <tr>
                  <td class="failed-task-title"><?= htmlspecialchars($task['title']) ?></td>
                  <td class="failed-task-title"><?= $completionDate ? date('d.m.Y', strtotime($completionDate)) : '' ?></td>
                  <td class="failed-task-title"><?= htmlspecialchars($comment) ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php else: ?>
          <div class="no-tasks">Нет проваленных задач</div>
        <?php endif; ?>
      </div>
      
      <div class="tasks-tab-content" id="incomplete-tasks-content">
        <?php if ($incompleteCount > 0): ?>
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Крайний срок</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($incompleteTasks as $task): ?>
                <tr>
                  <td><?= htmlspecialchars($task['title']) ?></td>
                  <td><?= date('d.m.Y', strtotime($task['deadline'])) ?></td>
                  <td>
                    <?= $task['status'] === 'not_started' ? 'Не начато' : 
                       ($task['status'] === 'in_progress' ? 'В процессе' : 
                       ($task['status'] === 'in_review' ? 'На проверке' : 
                       ($task['status'] === 'returned' ? 'Возвращено' : ''))) ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php else: ?>
          <div class="no-tasks">Нет задач в работе</div>
        <?php endif; ?>
      </div>
    </main>

    <footer class="footer">
      <p>© 2025 Task Manager | IT Компания</p>
    </footer>
  </div>

  <script>
    // Pass data from PHP to JS
    const MemberProfileData = {
      successCount: <?= $successCount ?>,
      failedCount: <?= $failedCount ?>,
      incompleteCount: <?= $incompleteCount ?>,
      currentUser: <?= json_encode($currentUser) ?>
    };
  </script>
  <script src="/public/assets/js/member-profile.js"></script>
</body>
</html>

member/dashboard.php
<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'member') {
    header("Location: ../auth.php");
    exit();
}

require_once __DIR__ . '/../data/db.php';

$db = new DB();
$currentUser = $_SESSION['user'];
$tasks = $db->getTasksByAssignee($currentUser['id']);

?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager - Member</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <link rel="stylesheet" href="/public/assets/css/dashboard.css">
</head>
<body>
  <div class="dashboard member-dashboard">
    <header class="header">
      <div class="logo">
        <i class="fas fa-tasks"></i>
        <h1>Task Manager</h1>
      </div>
      <div class="user-actions">
        <div class="user-profile">
          <img src="https://ui-avatars.com/api/?name=<?= urlencode($currentUser['username']) ?>&background=2575fc&color=fff" alt="<?= htmlspecialchars($currentUser['username']) ?>">
          <a href="profile.php"><?= htmlspecialchars($currentUser['username']) ?></a>
        </div>
        <a href="../auth.php?logout" class="btn-logout">
          <i class="fas fa-sign-out-alt"></i> Выйти
        </a>
        <button id="theme-toggle" class="theme-toggle">
          <i class="fas fa-moon"></i>
        </button>
      </div>
    </header>

    <main class="task-board">
      <div class="controls">
        <select id="task-filter" class="filter-select">
          <option value="all">Все задачи</option>
          <option value="not_started">Не начато</option>
          <option value="in_review">На проверке</option>
          <option value="completed">Завершено</option>
          <option value="returned">Возвращено</option>
        </select>
      </div>

      <div class="status-column" data-status="not_started">
        <div class="column-header">
          <h3>Не начато</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="not-started-tasks"></div>
      </div>

      <div class="status-column" data-status="in_review">
        <div class="column-header">
          <h3>На проверке</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="in-review-tasks"></div>
      </div>

      <div class="status-column" data-status="completed">
        <div class="column-header">
          <h3>Завершено</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="completed-tasks"></div>
      </div>

      <div class="status-column" data-status="returned">
        <div class="column-header">
          <h3>Возвращено</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="returned-tasks"></div>
      </div>

      <!-- Task Submission Section -->
      <div class="task-submission">
        <h3><i class="fas fa-paperclip"></i> Отправить задание</h3>
        <form id="submit-form" enctype="multipart/form-data">
          <div class="form-group">
            <label for="submit-task">Выберите задачу:</label>
            <select id="submit-task" required>
              <option value="">-- Выберите --</option>
            </select>
          </div>
          <div class="form-group">
            <label for="submit-comment">Комментарий:</label>
            <textarea id="submit-comment" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="submit-files">Прикрепить файлы:</label>
            <input type="file" id="submit-files" multiple>
            <div id="file-preview" class="file-preview"></div>
          </div>
          <button type="submit" class="btn-submit">
            <i class="fas fa-upload"></i> Отправить на проверку
          </button>
        </form>
      </div>
    </main>

    <!-- Task Details Modal -->
    <div class="modal" id="task-details-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2 id="task-details-title"></h2>
        <div class="task-meta">
          <span class="task-priority-badge"></span>
          <span class="task-deadline"></span>
          <span class="task-status"></span>
        </div>
        <p id="task-details-desc"></p>
        
        <h3>Файлы задания</h3>
        <div id="task-files-list" class="files-list"></div>
        
        <h3>Комментарии</h3>
        <div id="task-comments" class="comments-list"></div>

        <div class="task-actions" id="task-details-actions" style="margin-top: 20px; position: static;">
          <button id="delete-submissions-btn" class="btn-delete" style="padding: 8px 15px;">
            <i class="fas fa-trash"></i> Удалить отправленные ответы
          </button>
        </div>
        
        <!-- Only for returned tasks -->
        <div id="return-feedback" class="return-feedback">
          <h3>Причина возврата</h3>
          <p id="return-comment"></p>
          <div id="return-files-list" class="files-list"></div>
        </div>

        <!-- Only for completed tasks -->
        <div id="complete-feedback" class="complete-feedback">
          <h3>Оценка задания</h3>
          <p id="complete-comment"></p>
          <div id="complete-score" class="score"></div>
          <div id="complete-files-list" class="files-list"></div>
        </div>
      </div>
    </div>

    <!-- Real-time Notification -->
    <div id="notification" class="notification hidden">
      <span id="notification-message"></span>
    </div>
  </div>
    <footer class="footer">
      <p>© 2025 Task Manager | IT Компания</p>
    </footer>
  </div>

  <script>
    // Pass data from PHP to JS safely
    const currentUser = <?= json_encode($currentUser) ?>;
    const initialTasks = <?= json_encode($tasks) ?>;
    
    // Initialize empty arrays if data is missing
    window.tasks = Array.isArray(initialTasks) ? initialTasks : [];
    window.currentUser = currentUser || {};
    
    console.log('Initial data loaded:', { 
      tasks: window.tasks,
      currentUser: window.currentUser
    });
  </script>
  <script src="/public/assets/js/dashboard.js"></script>
</body>
</html>

admin/dashboard.php
<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    header("Location: ../auth.php");
    exit();
}

require_once __DIR__ . '/../data/db.php';

$db = new DB();
$currentUser = $_SESSION['user'];
$users = $db->getUsers();
$tasks = $db->getTasks();
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager - Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <link rel="stylesheet" href="/public/assets/css/dashboard.css">
</head>
<body>
  <div class="dashboard admin-dashboard">
    <header class="header">
      <div class="logo">
        <i class="fas fa-tasks"></i>
        <h1>Task Manager</h1>
      </div>
      <div class="user-actions">
        <div class="user-profile">
          <img src="https://ui-avatars.com/api/?name=<?= urlencode($currentUser['username']) ?>&background=6a11cb&color=fff" alt="<?= htmlspecialchars($currentUser['username']) ?>">
          <a href="profile.php"><?= htmlspecialchars($currentUser['username']) ?></a>
        </div>
        <a href="../auth.php?logout" class="btn-logout">
          <i class="fas fa-sign-out-alt"></i> Выйти
        </a>
        <button id="theme-toggle" class="theme-toggle">
          <i class="fas fa-moon"></i>
        </button>
      </div>
    </header>

    <main class="task-board">
      <div class="controls">
        <select id="task-filter" class="filter-select">
          <option value="all">Все задачи</option>
          <option value="not_started">Не начато</option>
          <option value="in_review">На проверке</option>
          <option value="completed">Завершено</option>
          <option value="returned">Возвращено</option>
        </select>
        <select id="user-filter" class="filter-select">
          <option value="all">Все пользователи</option>
          <?php foreach ($users as $user): ?>
            <?php if ($user['role'] === 'member'): ?>
              <option value="<?= $user['id'] ?>"><?= htmlspecialchars($user['username']) ?></option>
            <?php endif; ?>
          <?php endforeach; ?>
        </select>
      </div>

      <!-- Status Columns -->
      <div class="status-column" data-status="not_started">
        <div class="column-header">
          <h3>Не начато</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="not-started-tasks"></div>
        <button class="add-task-btn">
          <i class="fas fa-plus"></i> Добавить задачу
        </button>
      </div>

      <div class="status-column" data-status="in_review">
        <div class="column-header">
          <h3>На проверке</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="in-review-tasks"></div>
      </div>

      <div class="status-column" data-status="completed">
        <div class="column-header">
          <h3>Завершено</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="completed-tasks"></div>
      </div>

      <div class="status-column" data-status="returned">
        <div class="column-header">
          <h3>Возвращено</h3>
          <span class="task-count">0</span>
        </div>
        <div class="task-list" id="returned-tasks"></div>
      </div>
    </main>

    <!-- Add Task Modal -->
    <div class="modal" id="add-task-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Добавить задачу</h2>
        <form id="task-form">
          <div class="form-group">
            <label for="task-title">Название</label>
            <input type="text" id="task-title" required>
          </div>
          <div class="form-group">
            <label for="task-desc">Описание</label>
            <textarea id="task-desc" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="task-files">Прикрепить файлы</label>
            <input type="file" id="task-files" multiple>
            <div id="task-files-preview" class="file-preview"></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="task-deadline">Срок выполнения</label>
              <input type="date" id="task-deadline" required>
            </div>
            <div class="form-group">
              <label for="task-priority">Приоритет</label>
              <select id="task-priority">
                <option value="high">Высокий</option>
                <option value="medium" selected>Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="task-assignee">Назначить</label>
            <select id="task-assignee" required>
              <?php foreach ($users as $user): ?>
                <?php if ($user['role'] === 'member'): ?>
                  <option value="<?= $user['id'] ?>"><?= htmlspecialchars($user['username']) ?></option>
                <?php endif; ?>
              <?php endforeach; ?>
            </select>
          </div>
          <button type="submit" class="btn-submit">Создать задачу</button>
        </form>
      </div>
    </div>

    <!-- Edit Task Modal -->
    <div class="modal" id="edit-task-modal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Редактировать задачу</h2>
            <form id="edit-task-form">
                <input type="hidden" id="edit-task-id">
                <div class="form-group">
                    <label for="edit-task-title">Название</label>
                    <input type="text" id="edit-task-title" required>
                </div>
                <div class="form-group">
                    <label for="edit-task-desc">Описание</label>
                    <textarea id="edit-task-desc" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="edit-task-files">Прикрепить файлы</label>
                    <input type="file" id="edit-task-files" multiple>
                    <div id="edit-file-preview" class="file-preview"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-task-deadline">Срок выполнения</label>
                        <input type="date" id="edit-task-deadline" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-task-priority">Приоритет</label>
                        <select id="edit-task-priority">
                            <option value="high">Высокий</option>
                            <option value="medium">Средний</option>
                            <option value="low">Низкий</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="edit-task-assignee">Назначить</label>
                    <select id="edit-task-assignee" required>
                        <?php foreach ($users as $user): ?>
                            <?php if ($user['role'] === 'member'): ?>
                                <option value="<?= $user['id'] ?>"><?= htmlspecialchars($user['username']) ?></option>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label>Текущие файлы:</label>
                    <div id="current-files-list" class="files-list">
                        <?php if (!empty($task['files'])): ?>
                            <?php foreach ($task['files'] as $file): ?>
                                <div class="file-item">
                                    <a href="/../public/uploads/tasks/<?= basename($file) ?>" target="_blank"><?= basename($file) ?></a>
                                    <button type="button" class="btn-delete-file" data-file="<?= basename($file) ?>">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p>Нет прикрепленных файлов</p>
                        <?php endif; ?>
                    </div>
                </div>
                <button type="submit" class="btn-submit">Сохранить изменения</button>
            </form>
        </div>
    </div>

    <!-- Task Details Modal -->
    <div class="modal" id="task-details-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2 id="task-details-title"></h2>
        <div class="task-meta">
          <span class="task-priority-badge"></span>
          <span class="task-deadline"></span>
          <span class="task-status"></span>
          <span class="task-assignee"></span>
          <span class="task-creator"></span>
        </div>
        <p id="task-details-desc"></p>
        
        <h3>Файлы задания</h3>
        <div id="task-files-list" class="files-list"></div>
        
        <h3>Ответы на представленные задания</h3>
        <div id="task-submissions-list" class="submissions-list"></div>
        
        <h3>Обратная связь</h3>
        <div id="task-feedback-list" class="feedback-list"></div>
      </div>
    </div>

    <!-- Return Task Modal -->
    <div class="modal" id="return-task-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Возврат задачи на доработку</h2>
        <form id="return-form">
          <div class="form-group">
            <label for="return-comment">Комментарий</label>
            <textarea id="return-comment" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label for="return-files">Прикрепить файлы</label>
            <input type="file" id="return-files" multiple>
            <div id="return-files-preview" class="file-preview"></div>
          </div>
          <button type="submit" class="btn-submit">Отправить на доработку</button>
        </form>
      </div>
    </div>

    <!-- Complete Task Modal -->
    <div class="modal" id="complete-task-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Завершение задачи</h2>
        <form id="complete-form">
          <div class="form-group">
            <label for="complete-comment">Комментарий</label>
            <textarea id="complete-comment" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="complete-score">Оценка за задание (1-100)</label>
            <input type="number" id="complete-score" min="1" max="100" step="0.1">
          </div>
          <div class="form-group">
            <label for="complete-files">Прикрепить файлы</label>
            <input type="file" id="complete-files" multiple>
            <div id="complete-files-preview" class="file-preview"></div>
          </div>
          <button type="submit" class="btn-submit">Завершить задачу</button>
        </form>
      </div>
    </div>
  </div>
    <footer class="footer">
      <p>© 2025 Task Manager | IT Компания</p>
    </footer>
  </div>

  <script>
    const currentUser = <?= json_encode($currentUser) ?>;
    const users = <?= json_encode($users) ?>;  // Pastikan ini termasuk
    const initialTasks = <?= json_encode($tasks) ?>;
    
    window.tasks = Array.isArray(initialTasks) ? initialTasks : [];
    window.users = Array.isArray(users) ? users : [];
    window.currentUser = currentUser || {};
    
    console.log('Initial data loaded:', { 
      tasks: window.tasks,
      currentUser: window.currentUser
    });
  </script>
  <script src="/public/assets/js/dashboard.js"></script>
</body>
</html>

admin/profile.php
<?php
session_start();

// Redirect non-admin users
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    header("Location: ../auth.php");
    exit();
}

require_once __DIR__ . '/../data/db.php';

$db = new DB();
$currentUser = $_SESSION['user'];
$users = $db->getUsers();
$members = array_filter($users, fn($user) => $user['role'] === 'member');
$tasks = $db->getTasks();

// Ensure members is an array
$members = is_array($members) ? array_values($members) : [];

// Create TaskReport directory if not exists
if (!file_exists('../public/uploads/TaskReport')) {
    mkdir('../public/uploads/TaskReport', 0777, true);
}

// Calculate member statistics
$memberStats = [];
foreach ($members as $member) {
    $memberTasks = array_filter($tasks, fn($task) => $task['assignee_id'] == $member['id']);
    $completedTasks = array_filter($memberTasks, fn($task) => $task['status'] === 'completed');
    
    $successTasks = array_filter($completedTasks, function($task) {
        if (empty($task['feedback'])) return false;
        $completionFeedbacks = array_filter($task['feedback'], fn($fb) => $fb['type'] === 'completion');
        if (empty($completionFeedbacks)) return false;
        $lastFeedback = end($completionFeedbacks);
        return isset($lastFeedback['score']) && $lastFeedback['score'] > 0;
    });
    
    $failedTasks = array_filter($completedTasks, function($task) {
        if (empty($task['feedback'])) return false;
        $completionFeedbacks = array_filter($task['feedback'], fn($fb) => $fb['type'] === 'completion');
        if (empty($completionFeedbacks)) return false;
        $lastFeedback = end($completionFeedbacks);
        return isset($lastFeedback['score']) && $lastFeedback['score'] == 0;
    });
    
    $incompleteTasks = array_filter($memberTasks, fn($task) => $task['status'] !== 'completed');
    
    $scores = array_map(function($task) {
      if (empty($task['feedback'])) return 0;
      $completionFeedbacks = array_filter($task['feedback'], fn($fb) => $fb['type'] === 'completion');
      if (empty($completionFeedbacks)) return 0;
      $lastFeedback = end($completionFeedbacks);
      return $lastFeedback['score'] ?? 0;
    }, array_merge($successTasks, $failedTasks)); // Include both success and failed tasks
    
    $averageScore = !empty($scores) ? round(array_sum($scores) / count($scores), 1) : 0;
    
    $memberStats[$member['id']] = [
        'success_tasks' => count($successTasks),
        'failed_tasks' => count($failedTasks),
        'incomplete_tasks' => count($incompleteTasks),
        'average_score' => $averageScore
    ];
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager - Admin Profile</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <link rel="stylesheet" href="/public/assets/css/dashboard.css">
  <link rel="stylesheet" href="/public/assets/css/profile.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
  <div class="dashboard admin-profile">
    <header class="header">
      <div class="logo">
        <i class="fas fa-tasks"></i>
        <h1>Task Manager</h1>
      </div>
      <div class="user-actions">
        <div class="user-profile">
          <img src="https://ui-avatars.com/api/?name=<?= urlencode($currentUser['username']) ?>&background=6a11cb&color=fff" alt="<?= htmlspecialchars($currentUser['username']) ?>">
          <span><?= htmlspecialchars($currentUser['username']) ?></span>
        </div>
        <a href="dashboard.php" class="btn-home">
          <i class="fas fa-home"></i> На главную
        </a>
        <a href="../auth.php?logout" class="btn-logout">
          <i class="fas fa-sign-out-alt"></i> Выйти
        </a>
        <button class="btn-delete-account" onclick="AdminProfile.deleteOwnAccount()">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <path d="M5 6l2 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l2-12"></path>
            </svg>
            Удалить свой аккаунт
        </button>
        <button id="theme-toggle" class="theme-toggle">
          <i class="fas fa-moon"></i>
        </button>
      </div>
    </header>

    <main class="profile-content">
      <div class="profile-header">
        <h2><i class="fas fa-user-cog"></i> Управление участниками</h2>
        <button id="download-all-report" class="btn-download">
          <i class="fas fa-file-excel"></i> Скачать отчет по всем участникам
        </button>
      </div>
      
      <div class="members-list">
        <?php foreach ($members as $member): ?>
          <div class="member-card" data-member-id="<?= $member['id'] ?>">
            <div class="member-info" onclick="AdminProfile.showMemberTasks(<?= $member['id'] ?>, '<?= htmlspecialchars($member['username']) ?>')">
              <img src="https://ui-avatars.com/api/?name=<?= urlencode($member['username']) ?>&background=2575fc&color=fff" alt="<?= htmlspecialchars($member['username']) ?>">
              <div class="member-details">
                <h3><?= htmlspecialchars($member['username']) ?></h3>
                <div class="member-stats">
                  <span class="stat-badge success"><?= $memberStats[$member['id']]['success_tasks'] ?> успешно</span>
                  <span class="stat-badge failed"><?= $memberStats[$member['id']]['failed_tasks'] ?> провалено</span>
                  <span class="stat-badge incomplete"><?= $memberStats[$member['id']]['incomplete_tasks'] ?> в работе</span>
                  <span class="stat-badge rating">Рейтинг: <?= $memberStats[$member['id']]['average_score'] ?></span>
                </div>
              </div>
            </div>
            <button class="btn-kick" data-member-id="<?= $member['id'] ?>" data-member-name="<?= htmlspecialchars($member['username']) ?>">
              <i class="fas fa-user-times"></i> Удалить
            </button>
          </div>
        <?php endforeach; ?>
      </div>
    </main>

    <!-- Member Tasks Modal -->
    <div class="modal" id="member-tasks-modal">
      <div class="modal-content">
        <span class="close-modal">×</span>
        <h2 id="member-tasks-title"></h2>
        
        <div class="member-stats-container">
          <div class="chart-container">
            <canvas id="tasks-chart"></canvas>
          </div>
          <div class="stats-summary">
            <div class="stat-item">
              <span class="stat-label">Успешные:</span>
              <span class="stat-value" id="success-count">0</span>
              <span class="stat-percent" id="success-percent">0%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Проваленные:</span>
              <span class="stat-value" id="failed-count">0</span>
              <span class="stat-percent" id="failed-percent">0%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">В работе:</span>
              <span class="stat-value" id="incomplete-count">0</span>
              <span class="stat-percent" id="incomplete-percent">0%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Общий рейтинг:</span>
              <span class="stat-value" id="member-rating">0</span>
            </div>
          </div>
        </div>
        
        <div class="tasks-tabs">
          <button class="tab-btn active" data-tab="success">Успешные задачи</button>
          <button class="tab-btn" data-tab="failed">Проваленные задачи</button>
          <button class="tab-btn" data-tab="incomplete">Задачи в работе</button>
        </div>
        
        <div class="tasks-tab-content active" id="success-tasks-content">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Дата завершения</th>
                <th>Оценка</th>
              </tr>
            </thead>
            <tbody id="success-tasks-list"></tbody>
          </table>
        </div>
        
        <div class="tasks-tab-content" id="failed-tasks-content">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Дата завершения</th>
                <th>Причина</th>
              </tr>
            </thead>
            <tbody id="failed-tasks-list"></tbody>
          </table>
        </div>
        
        <div class="tasks-tab-content" id="incomplete-tasks-content">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Крайний срок</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody id="incomplete-tasks-list"></tbody>
          </table>
        </div>
        
        <div class="modal-footer">
          <button id="download-member-report" class="btn-download">
            <i class="fas fa-file-excel"></i> Скачать отчет по участнику
          </button>
        </div>
      </div>
    </div>

    <footer class="footer">
      <p>© 2025 Task Manager | IT Компания</p>
    </footer>
  </div>

  <script>
    // Pass data from PHP to JS
    const AdminProfileData = {
      members: <?= json_encode($members) ?>,
      tasks: <?= json_encode($tasks) ?>,
      memberStats: <?= json_encode($memberStats) ?>,
      currentUser: <?= json_encode($currentUser) ?>
    };
  </script>
  <script src="/public/assets/js/admin-profile.js"></script>
</body>
</html>

auth.php (tanpa folder/diluar folder)
<?php
session_start();

// Helper functions
function getData() {
    if (!file_exists(__DIR__ . '/data/data.json')) {
        file_put_contents(__DIR__ . '/data/data.json', json_encode(['users' => [], 'tasks' => []]));
    }
    return json_decode(file_get_contents(__DIR__ . '/data/data.json'), true);
}

function saveData($data) {
    file_put_contents(__DIR__ . '/data/data.json', json_encode($data, JSON_PRETTY_PRINT));
}

function redirect($url) {
    header("Location: $url");
    exit();
}

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login-email'])) {
    $email = $_POST['login-email'];
    $password = $_POST['login-password'];
    $role = $_POST['login-role'];
    
    $data = getData();
    
    foreach ($data['users'] as $user) {
        if ($user['email'] === $email && password_verify($password, $user['password'])) {
            if ($user['role'] === $role) {
                $_SESSION['user'] = $user;
                
                if ($role === 'admin') {
                    redirect('admin/dashboard.php');
                } else {
                    redirect('member/dashboard.php');
                }
            }
        }
    }
    
    $_SESSION['error'] = "Неверный email, пароль или роль";
    redirect('auth.php');
}

// Handle registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register-username'])) {
    $username = $_POST['register-username'];
    $email = $_POST['register-email'];
    $password = password_hash($_POST['register-password'], PASSWORD_DEFAULT);
    $role = $_POST['register-role'];
    $secretKey = $_POST['register-secret-key'] ?? '';
    
    // Validate admin secret key
    if ($role === 'admin') {
      if ($secretKey !== '4321') {
          $_SESSION['error'] = "Неверный секретный ключ администратора";
          redirect('auth.php');
      }
    }
    
    $data = getData();
    
    // Check if email exists
    foreach ($data['users'] as $user) {
        if ($user['email'] === $email) {
            $_SESSION['error'] = "Email уже зарегистрирован";
            redirect('auth.php');
        }
    }
    
    // Create new user
    $newUser = [
        'id' => count($data['users']) + 1,
        'username' => $username,
        'email' => $email,
        'password' => $password,
        'role' => $role,
        'created_at' => date('c')
    ];
    
    $data['users'][] = $newUser;
    saveData($data);
    
    $_SESSION['user'] = $newUser;
    
    if ($role === 'admin') {
        redirect('admin/dashboard.php');
    } else {
        redirect('member/dashboard.php');
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    redirect('auth.php');
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager - Auth</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/public/assets/css/auth.css">
</head>
<body>
  <div class="auth-container">
    <!-- Error message -->
    <?php if (isset($_SESSION['error'])): ?>
      <div class="alert alert-error"><?= $_SESSION['error'] ?></div>
      <?php unset($_SESSION['error']); ?>
    <?php endif; ?>

    <!-- Tab Login/Register -->
    <div class="tab-container">
      <button class="tab active" data-tab="login">Вход</button>
      <button class="tab" data-tab="register">Регистрация</button>
    </div>

    <!-- Login Form -->
    <form id="login-form" class="form active" method="POST">
      <div class="input-group">
        <input type="email" id="login-email" name="login-email" placeholder="Email" required>
        <span class="input-icon">✉️</span>
      </div>
      <div class="input-group">
        <input type="password" id="login-password" name="login-password" placeholder="Пароль" required>
        <span class="input-icon">🔒</span>
      </div>
      <select id="login-role" name="login-role" class="role-select" required>
        <option value="member">Участник</option>
        <option value="admin">Администратор</option>
      </select>
      <button type="submit" class="btn-gradient">Войти</button>
    </form>

    <!-- Register Form -->
    <form id="register-form" class="form" method="POST">
      <div class="input-group">
        <input type="text" id="register-username" name="register-username" placeholder="Имя пользователя" required>
        <span class="input-icon">👤</span>
      </div>
      <div class="input-group">
        <input type="email" id="register-email" name="register-email" placeholder="Email" required>
        <span class="input-icon">✉️</span>
      </div>
      <div class="input-group">
        <input type="password" id="register-password" name="register-password" placeholder="Пароль" required>
        <span class="input-icon">🔒</span>
      </div>
      <div class="input-group">
        <input type="password" id="register-confirm-password" placeholder="Повторите пароль" required>
        <span class="input-icon">🔒</span>
      </div>
      <select id="register-role" name="register-role" class="role-select" required>
        <option value="member">Участник</option>
        <option value="admin">Администратор</option>
      </select>
      <div id="secret-key-container" style="display:none;">
        <div class="input-group">
          <input type="password" id="register-secret-key" name="register-secret-key" placeholder="Секретный ключ (4321)">
          <span class="input-icon">🗝️</span>
        </div>
      </div>
      <button type="submit" class="btn-gradient">Зарегистрироваться</button>
    </form>
  </div>

  <script src="/public/assets/js/auth.js"></script>
</body>
</html>

api/auth.php
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../data/db.php';

session_start();

// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

$db = new DB();
$response = ['success' => false, 'message' => ''];

try {
    // Only handle POST and DELETE requests
    if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
        throw new Exception('Invalid request method');
    }

    // Get the input data
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }

    // Route the request based on action
    $action = $input['action'] ?? $_SERVER['REQUEST_METHOD'];
    switch ($action) {
        case 'login':
            handleLogin($input, $db);
            break;
        case 'register':
            handleRegister($input, $db);
            break;
        case 'logout':
            handleLogout();
            break;
        case 'DELETE':
            // Delete user (admin only)
            if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
                throw new Exception('Forbidden', 403);
            }

            if (empty($input['user_id'])) {
                throw new Exception('User ID is required', 400);
            }

            $userId = (int)$input['user_id'];
            $isSelfDelete = isset($input['self_delete']) && $input['self_delete'] === true;

            // Allow self-deletion only if explicitly requested
            if (!$isSelfDelete && $userId === $_SESSION['user']['id']) {
                throw new Exception('Cannot delete yourself without confirmation', 400);
            }

            $success = $db->deleteUser($userId);
            if ($success && $isSelfDelete) {
                // Clear session on self-deletion
                session_destroy();
            }

            $response = [
                'success' => $success,
                'message' => $success ? 'User deleted successfully' : 'Failed to delete user'
            ];
            break;
        case 'check-auth':
            handleCheckAuth();
            break;
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    http_response_code($e->getCode() ?: 400);
}

// Ensure clean JSON output
echo json_encode($response);
exit;

/**
 * Sanitize input data
 * @param mixed $data Input data
 * @return mixed Sanitized data
 */
function sanitize($data) {
    if (is_array($data)) {
        return array_map('sanitize', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)));
}

/**
 * Handle login request
 */
function handleLogin($input, $db) {
    global $response;

    // Validate input
    if (empty($input['email']) || empty($input['password']) || empty($input['role'])) {
        throw new Exception('All fields are required');
    }

    $email = sanitize($input['email']);
    $password = $input['password'];
    $role = sanitize($input['role']);

    // Find user
    $user = $db->getUserByEmail($email);
    if (!$user || $user['role'] !== $role) {
        throw new Exception('Invalid credentials');
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        throw new Exception('Invalid credentials');
    }

    // Set session
    $_SESSION['user'] = [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role']
    ];

    $response = [
        'success' => true,
        'message' => 'Login successful',
        'user' => $_SESSION['user'],
        'redirect' => $user['role'] === 'admin' ? '/admin/dashboard.php' : '/member/dashboard.php'
    ];
    
    echo json_encode($response);
    exit;
}

/**
 * Handle registration request
 */
function handleRegister($input, $db) {
    global $response;

    // Validate input
    $required = ['username', 'email', 'password', 'role'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception('All fields are required');
        }
    }

    $username = sanitize($input['username']);
    $email = sanitize($input['email']);
    $password = $input['password'];
    $role = sanitize($input['role']);
    $secretKey = $input['secret_key'] ?? '';

    // Additional validation for admin registration
    if ($role === 'admin') {
        if ($secretKey !== '4321') {
            throw new Exception('Invalid admin secret key');
        }
    }

    // Check if email exists
    if ($db->getUserByEmail($email)) {
        throw new Exception('Email already registered');
    }

    // Create new user
    $newUser = [
        'username' => $username,
        'email' => $email,
        'password' => password_hash($password, PASSWORD_DEFAULT),
        'role' => $role,
        'created_at' => date('Y-m-d H:i:s')
    ];

    $userId = $db->createUser($newUser);

    // Set session
    $_SESSION['user'] = [
        'id' => $userId,
        'username' => $username,
        'email' => $email,
        'role' => $role
    ];

    $response = [
        'success' => true,
        'message' => 'Registration successful',
        'user' => $_SESSION['user'],
        'redirect' => $role === 'admin' ? '/admin/dashboard.php' : '/member/dashboard.php'
    ];
    
    echo json_encode($response);
    exit;
}

/**
 * Handle logout request
 */
function handleLogout() {
    global $response;
    
    // Destroy session
    session_destroy();
    
    $response = [
        'success' => true,
        'message' => 'Logout successful',
        'redirect' => '/auth.php'
    ];
    
    echo json_encode($response);
    exit;
}

/**
 * Check authentication status
 */
function handleCheckAuth() {
    global $response;
    
    if (isset($_SESSION['user'])) {
        $response = [
            'success' => true,
            'authenticated' => true,
            'user' => $_SESSION['user']
        ];
    } else {
        $response = [
            'success' => true,
            'authenticated' => false
        ];
    }
    
    echo json_encode($response);
    exit;
}

tolong sesuaikan lagi pada bagian yang membutuhkan skrip yang kurang diatas, karena kan kata andasebelumnya skripitu tidak terlampir di respon 1-3
