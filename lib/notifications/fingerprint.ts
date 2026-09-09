function fnv1a32(
  value:
    string,
  seed:
    number,
): number {
  let hash =
    seed >>>
    0;


  for (
    let index =
      0;
    index <
    value.length;
    index +=
      1
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );


    hash =
      Math.imul(
        hash,
        0x01000193,
      ) >>>
      0;
  }


  return hash;
}


export function deterministicAlertFingerprint(
  value:
    string,
): string {
  const left =
    fnv1a32(
      value,
      0x811c9dc5,
    );


  const right =
    fnv1a32(
      [...value]
        .reverse()
        .join(
          "",
        ),
      0x9e3779b9,
    );


  return (
    left
      .toString(
        16,
      )
      .padStart(
        8,
        "0",
      )
    +
    right
      .toString(
        16,
      )
      .padStart(
        8,
        "0",
      )
  );
}
