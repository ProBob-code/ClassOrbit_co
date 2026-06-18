UPDATE blogs SET content = REPLACE(content, '\n', char(10));
UPDATE blogs SET title = REPLACE(title, ' — ', ' - '), excerpt = REPLACE(excerpt, ' — ', ' - '), content = REPLACE(content, ' — ', ' - ');
