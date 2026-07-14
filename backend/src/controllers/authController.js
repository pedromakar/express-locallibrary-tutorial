const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Notification = require('../models/notification');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });
  if (existingUser) {
    return res.status(409).json({ message: 'Usuário ou e-mail já cadastrado' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const role = 'user';
  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    role,
  });

  res.status(201).json({
    message: 'Cadastro realizado com sucesso',
    user: { username: user.username, email: user.email, role: user.role },
  });

  // Create notification for admin (fire-and-forget)
  Notification.create({
    type: 'new_customer',
    title: 'Novo cliente cadastrado',
    message: `${user.username} (${user.email}) acabou de se cadastrar.`,
    relatedId: user._id.toString(),
  }).catch(() => {});
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const normalizedLogin = username.trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ username: normalizedLogin }, { email: normalizedLogin }],
  });
  if (!user) {
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Senha incorreta' });
  }

  // Update lastLogin
  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '6h' }
  );

  res.json({ token, username: user.username, role: user.role });
};

exports.me = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No authenticated user' });
  }
  res.json({ user: req.user });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório' });
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'E-mail não cadastrado' });
  }
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  res.json({
    message: 'Código de recuperação enviado (simulado).',
    token: resetToken,
  });
};

exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'E-mail não cadastrado' });
  }
  if (token.length !== 6) {
    return res.status(400).json({ message: 'Código de recuperação inválido' });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  res.json({ message: 'Senha atualizada com sucesso!' });
};
