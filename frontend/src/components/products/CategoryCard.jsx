import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  return (
    <article className="card category-card">
      <div className="category-image">
        {category.image ? <img src={category.image} alt={category.title} /> : <span>Sem imagem</span>}
      </div>
      <div className="category-body">
        <h3>{category.title}</h3>
        <p>{category.description}</p>
        <Link className="button small" to={`/products?category=${encodeURIComponent(category.title)}`}>
          Ver categoria
        </Link>
      </div>
    </article>
  );
};

export default CategoryCard;
