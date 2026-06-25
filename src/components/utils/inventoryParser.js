export function mapRowsToObjects(rows, headers, COLUMN_MAP, normalize) {
  return rows.map((row) => {
    const item = {};

    Object.entries(COLUMN_MAP)

      .forEach(([key, aliases]) => {
        const index = headers.findIndex((header) =>
          aliases.some((alias) => normalize(header) === normalize(alias)),
        );

        item[key] = row[index];
      });

    return item;
  });
}
