CREATE DATABASE IF NOT EXISTS phase_transition_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE phase_transition_db;

CREATE TABLE IF NOT EXISTS experiments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '实验名称',
    material VARCHAR(255) NOT NULL COMMENT '材料名称',
    experiment_type ENUM('heating', 'cooling') NOT NULL COMMENT '实验类型：升温/降温',
    description TEXT COMMENT '实验描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验记录表';

CREATE TABLE IF NOT EXISTS data_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    experiment_id INT NOT NULL,
    time_value DOUBLE NOT NULL COMMENT '时间值（秒）',
    temperature DOUBLE NOT NULL COMMENT '温度值（℃）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
    INDEX idx_experiment_id (experiment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据点表';

INSERT INTO experiments (name, material, experiment_type, description) VALUES
('钢样A升温实验', '45号钢', 'heating', '碳钢相变温度测定'),
('铝合金冷却实验', '6061铝合金', 'cooling', '铝合金固溶处理冷却曲线');

INSERT INTO data_points (experiment_id, time_value, temperature) VALUES
(1, 0, 25),
(1, 10, 100),
(1, 20, 180),
(1, 30, 260),
(1, 40, 340),
(1, 50, 420),
(1, 60, 500),
(1, 70, 570),
(1, 80, 630),
(1, 90, 680),
(1, 100, 720),
(1, 110, 750),
(1, 120, 770),
(1, 130, 780),
(1, 140, 785),
(1, 150, 790),
(1, 160, 810),
(1, 170, 840),
(1, 180, 880),
(1, 190, 920),
(1, 200, 960),
(1, 210, 1000),
(2, 0, 550),
(2, 10, 530),
(2, 20, 510),
(2, 30, 490),
(2, 40, 470),
(2, 50, 450),
(2, 60, 430),
(2, 70, 410),
(2, 80, 390),
(2, 90, 365),
(2, 100, 340),
(2, 110, 320),
(2, 120, 305),
(2, 130, 295),
(2, 140, 288),
(2, 150, 282),
(2, 160, 275),
(2, 170, 265),
(2, 180, 250),
(2, 190, 230),
(2, 200, 200),
(2, 210, 170),
(2, 220, 140),
(2, 230, 110),
(2, 240, 80),
(2, 250, 50),
(2, 260, 25);
