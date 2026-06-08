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
