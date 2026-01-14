<?php
namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            // Categorías Masculinas
            ['nombre' => 'Sub-6 Masculino', 'edad_minima' => 4, 'edad_maxima' => 6, 'genero' => 'masculino', 'descripcion' => 'Categoría infantil masculina', 'activo' => true],
            ['nombre' => 'Sub-8 Masculino', 'edad_minima' => 7, 'edad_maxima' => 8, 'genero' => 'masculino', 'descripcion' => 'Categoría infantil masculina', 'activo' => true],
            ['nombre' => 'Sub-10 Masculino', 'edad_minima' => 9, 'edad_maxima' => 10, 'genero' => 'masculino', 'descripcion' => 'Categoría pre-infantil masculina', 'activo' => true],
            ['nombre' => 'Sub-12 Masculino', 'edad_minima' => 11, 'edad_maxima' => 12, 'genero' => 'masculino', 'descripcion' => 'Categoría infantil masculina', 'activo' => true],
            ['nombre' => 'Sub-14 Masculino', 'edad_minima' => 13, 'edad_maxima' => 14, 'genero' => 'masculino', 'descripcion' => 'Categoría cadete masculina', 'activo' => true],
            ['nombre' => 'Sub-16 Masculino', 'edad_minima' => 15, 'edad_maxima' => 16, 'genero' => 'masculino', 'descripcion' => 'Categoría juvenil masculina', 'activo' => true],
            ['nombre' => 'Sub-18 Masculino', 'edad_minima' => 17, 'edad_maxima' => 18, 'genero' => 'masculino', 'descripcion' => 'Categoría juvenil masculina', 'activo' => true],
            ['nombre' => 'Sub-20 Masculino', 'edad_minima' => 19, 'edad_maxima' => 20, 'genero' => 'masculino', 'descripcion' => 'Categoría juvenil masculina', 'activo' => true],
            ['nombre' => 'Adulto Masculino', 'edad_minima' => 21, 'edad_maxima' => 99, 'genero' => 'masculino', 'descripcion' => 'Categoría adulta masculina', 'activo' => true],
            
            // Categorías Femeninas
            ['nombre' => 'Sub-6 Femenino', 'edad_minima' => 4, 'edad_maxima' => 6, 'genero' => 'femenino', 'descripcion' => 'Categoría infantil femenina', 'activo' => true],
            ['nombre' => 'Sub-8 Femenino', 'edad_minima' => 7, 'edad_maxima' => 8, 'genero' => 'femenino', 'descripcion' => 'Categoría infantil femenina', 'activo' => true],
            ['nombre' => 'Sub-10 Femenino', 'edad_minima' => 9, 'edad_maxima' => 10, 'genero' => 'femenino', 'descripcion' => 'Categoría pre-infantil femenina', 'activo' => true],
            ['nombre' => 'Sub-12 Femenino', 'edad_minima' => 11, 'edad_maxima' => 12, 'genero' => 'femenino', 'descripcion' => 'Categoría infantil femenina', 'activo' => true],
            ['nombre' => 'Sub-14 Femenino', 'edad_minima' => 13, 'edad_maxima' => 14, 'genero' => 'femenino', 'descripcion' => 'Categoría cadete femenina', 'activo' => true],
            ['nombre' => 'Sub-16 Femenino', 'edad_minima' => 15, 'edad_maxima' => 16, 'genero' => 'femenino', 'descripcion' => 'Categoría juvenil femenina', 'activo' => true],
            ['nombre' => 'Sub-18 Femenino', 'edad_minima' => 17, 'edad_maxima' => 18, 'genero' => 'femenino', 'descripcion' => 'Categoría juvenil femenina', 'activo' => true],
            ['nombre' => 'Sub-20 Femenino', 'edad_minima' => 19, 'edad_maxima' => 20, 'genero' => 'femenino', 'descripcion' => 'Categoría juvenil femenina', 'activo' => true],
            ['nombre' => 'Adulto Femenino', 'edad_minima' => 21, 'edad_maxima' => 99, 'genero' => 'femenino', 'descripcion' => 'Categoría adulta femenina', 'activo' => true],
            
            // Categorías Mixtas
            ['nombre' => 'Iniciación Mixta', 'edad_minima' => 4, 'edad_maxima' => 8, 'genero' => 'mixto', 'descripcion' => 'Categoría de iniciación mixta', 'activo' => true],
        ];

        foreach ($categorias as $categoria) {
            Categoria::create($categoria);
        }
    }
}
