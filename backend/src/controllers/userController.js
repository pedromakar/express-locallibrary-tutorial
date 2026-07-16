const User = require('../models/user');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').populate('cart.product');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    user.role = role || user.role;
    await user.save();
    res.json({ message: 'Papel do usuário atualizado', user });
  } catch (err) {
    res.status(400).json({ message: 'Dados inválidos', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json({ message: 'Usuário removido' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover usuário', error: err.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).populate('cart.product');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar carrinho', error: err.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { cart } = req.body; // Expecting [{product: id, quantity: n}]
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    
    user.cart = cart;
    await user.save();
    
    const updatedUser = await User.findById(user._id).populate('cart.product');
    res.json(updatedUser.cart);
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar carrinho', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar perfil', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const { username, email, password, avatar, addresses, marketingPreferences } = req.body;

    if (username) {
      const normalizedUsername = username.trim().toLowerCase();
      // Check if username is taken by someone else
      const existingUser = await User.findOne({ username: normalizedUsername });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: 'Nome de usuário já cadastrado' });
      }
      user.username = normalizedUsername;
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      // Check if email is taken by someone else
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: 'E-mail já cadastrado' });
      }
      user.email = normalizedEmail;
    }

    if (password) {
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(password, 10);
    }

    if (avatar !== undefined) user.avatar = avatar;
    if (addresses !== undefined) user.addresses = addresses;
    if (marketingPreferences !== undefined) user.marketingPreferences = marketingPreferences;

    await user.save();

    // Fetch user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ message: 'Perfil updated com sucesso', user: updatedUser });
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar perfil', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const { username, email, avatar } = req.body;

    if (username) {
      const normalizedUsername = username.trim().toLowerCase();
      const existingUser = await User.findOne({ username: normalizedUsername });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: 'Nome de usuário já cadastrado' });
      }
      user.username = normalizedUsername;
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: 'E-mail já cadastrado' });
      }
      user.email = normalizedEmail;
    }

    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ message: 'Perfil do usuário atualizado com sucesso', user: updatedUser });
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar usuário', error: err.message });
  }
};
