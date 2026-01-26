-- editorsテーブルをsectionsにリネーム
ALTER TABLE editors RENAME TO sections;

-- phases.editor_idをsection_idにリネーム
ALTER TABLE phases RENAME COLUMN editor_id TO section_id;

-- インデックスも再作成
DROP INDEX IF EXISTS idx_phases_editor_id;
CREATE INDEX IF NOT EXISTS idx_phases_section_id ON phases(section_id);

