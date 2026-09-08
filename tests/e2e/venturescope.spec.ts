import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";

type Credentials = {
  name: string;

  email: string;

  password: string;
};

const PASSWORD =
  "VentureScope-E2E-2026!";

function uniqueCredentials(
  prefix: string,
): Credentials {
  const unique =
    `${Date.now()}-${Math.random()
      .toString(
        36,
      )
      .slice(
        2,
        10,
      )}`;

  return {
    name:
      `${prefix} User`,

    email:
      `${prefix.toLowerCase()}-${unique}@example.test`,

    password:
      PASSWORD,
  };
}

async function submitForm(
  form: Locator,
): Promise<void> {
  await form.evaluate(
    (
      element,
    ) => {
      if (
        !(
          element instanceof
          HTMLFormElement
        )
      ) {
        throw new Error(
          "Expected HTMLFormElement",
        );
      }

      element.requestSubmit();
    },
  );
}

async function settle(
  page: Page,
): Promise<void> {
  await page
    .waitForLoadState(
      "networkidle",
      {
        timeout:
          8_000,
      },
    )
    .catch(
      () => {},
    );

  await page.waitForTimeout(
    250,
  );
}

function fieldLabelPattern(
  name: string,
): RegExp {
  const patterns:
    Record<
      string,
      RegExp
    > = {
      name:
        /project name|company name|business name|venture name|name/i,

      industry:
        /industry|sector/i,

      startMonth:
        /start month|starting month|forecast start|model start/i,

      startingCash:
        /starting cash|opening cash|initial cash/i,

      corporateTaxRate:
        /corporate tax|tax rate/i,

      startingCustomers:
        /starting customers|initial customers/i,

      arpu:
        /arpu|average revenue per user|average revenue per customer/i,

      monthlyChurnRate:
        /monthly churn|churn rate/i,

      cac:
        /cac|customer acquisition cost/i,

      organicNewCustomers:
        /organic.*customers|organic acquisition/i,

      customerAcquisitionGrowthRate:
        /acquisition growth|customer acquisition growth/i,

      arpuGrowthRate:
        /arpu growth/i,

      monthlyOneTimeRevenue:
        /one.?time revenue/i,

      salariesMonthly:
        /monthly salar|salaries/i,

      salaryAnnualGrowthRate:
        /salary.*growth|annual salary growth/i,

      rentMonthly:
        /monthly rent|rent/i,

      rentAnnualGrowthRate:
        /rent.*growth|annual rent growth/i,

      marketingMonthly:
        /monthly marketing|marketing budget/i,

      marketingGrowthRate:
        /marketing.*growth/i,

      cogsPercentage:
        /cogs.*percent|cost of goods.*percent/i,

      cogsFixedMonthly:
        /fixed.*cogs|fixed monthly.*cost of goods/i,

      software:
        /software/i,

      professionalServices:
        /professional services/i,

      insurance:
        /insurance/i,

      utilities:
        /utilities/i,

      travel:
        /travel/i,

      other:
        /^other$|other operating/i,
    };

  return (
    patterns[
      name
    ] ??
    new RegExp(
      name.replace(
        /([A-Z])/g,
        " $1",
      ),
      "i",
    )
  );
}


function selectLabelPattern(
  name: string,
): RegExp {
  const patterns:
    Record<
      string,
      RegExp
    > = {
      currency:
        /currency/i,

      horizonMonths:
        /horizon|forecast period|forecast length/i,

      revenueMode:
        /revenue model|revenue mode/i,

      marketingGrowthPeriod:
        /marketing.*period|growth period/i,

      cogsMethod:
        /cogs.*method|cost of goods.*method/i,
    };

  return (
    patterns[
      name
    ] ??
    fieldLabelPattern(
      name,
    )
  );
}


function optionPattern(
  value: string,
): RegExp {
  const patterns:
    Record<
      string,
      RegExp
    > = {
      EUR:
        /^EUR\b|Euro/i,

      USD:
        /^USD\b|US Dollar/i,

      GBP:
        /^GBP\b|Pound/i,

      TND:
        /^TND\b|Tunisian/i,

      CAD:
        /^CAD\b|Canadian/i,

      AED:
        /^AED\b|Emirati|Dirham/i,

      CHF:
        /^CHF\b|Swiss Franc/i,

      "12":
        /^12\b.*month/i,

      "24":
        /^24\b.*month/i,

      "36":
        /^36\b.*month/i,

      "48":
        /^48\b.*month/i,

      "60":
        /^60\b.*month/i,

      MONTHLY:
        /monthly/i,

      ANNUAL:
        /annual|yearly/i,

      PERCENTAGE:
        /percentage|percent of revenue/i,

      FIXED_MONTHLY:
        /fixed monthly|fixed amount/i,

      CUSTOMER_DRIVEN:
        /customer.?driven|customer model/i,

      DIRECT:
        /direct revenue|direct model/i,
    };

  return (
    patterns[
      value
    ] ??
    new RegExp(
      value,
      "i",
    )
  );
}


async function resolveVisibleInput(
  page: Page,
  name: string,
  required = true,
): Promise<
  Locator | null
> {
  const labelPattern =
    fieldLabelPattern(
      name,
    );

  const labelled =
    page
      .getByLabel(
        labelPattern,
      )
      .filter({
        visible:
          true,
      })
      .first();

  if (
    await labelled.count()
  ) {
    return labelled;
  }

  const named =
    page
      .locator(
        `input[name="${name}"]:visible`,
      )
      .first();

  if (
    await named.count()
  ) {
    return named;
  }

  if (
    name ===
    "startMonth"
  ) {
    const month =
      page
        .locator(
          'input[type="month"]:visible',
        )
        .first();

    if (
      await month.count()
    ) {
      return month;
    }
  }

  if (
    name ===
    "name"
  ) {
    const projectNameCandidates =
      page.locator(
        [
          'main input[type="text"]:visible',
          'main input:not([type]):visible',
        ].join(
          ", ",
        ),
      );

    const count =
      await projectNameCandidates.count();

    if (
      count >
      0
    ) {
      return projectNameCandidates.first();
    }
  }

  if (
    !required
  ) {
    return null;
  }

  const diagnostics =
    await page
      .locator(
        "input:visible",
      )
      .evaluateAll(
        (
          elements,
        ) =>
          elements.map(
            (
              element,
            ) => ({
              name:
                element.getAttribute(
                  "name",
                ),

              type:
                element.getAttribute(
                  "type",
                ),

              id:
                element.getAttribute(
                  "id",
                ),

              placeholder:
                element.getAttribute(
                  "placeholder",
                ),

              ariaLabel:
                element.getAttribute(
                  "aria-label",
                ),
            }),
          ),
      );

  throw new Error(
    [
      `Could not resolve visible input "${name}".`,
      `Visible inputs: ${JSON.stringify(
        diagnostics,
      )}`,
    ].join(
      "\n",
    ),
  );
}


async function fillInput(
  page: Page,
  name: string,
  value: string,
): Promise<void> {
  const input =
    await resolveVisibleInput(
      page,
      name,
      true,
    );

  if (!input) {
    throw new Error(
      `Required input ${name} was not found.`,
    );
  }

  await expect(
    input,
  ).toBeVisible();

  await expect(
    input,
  ).toBeEditable({
    timeout:
      3000,
  });

  await input.fill(
    value,
  );
}


async function fillInputIfPresent(
  page: Page,
  name: string,
  value: string,
): Promise<void> {
  const input =
    await resolveVisibleInput(
      page,
      name,
      false,
    );

  if (
    input
  ) {
    await input.fill(
      value,
    );
  }
}


async function selectValue(
  page: Page,
  name: string,
  value: string,
): Promise<void> {
  const native =
    page
      .locator(
        `select[name="${name}"]:visible`,
      )
      .first();

  if (
    await native.count()
  ) {
    await native.selectOption(
      value,
    );

    return;
  }

  const labelPattern =
    selectLabelPattern(
      name,
    );

  const labelled =
    page
      .getByLabel(
        labelPattern,
      )
      .first();

  if (
    await labelled.count()
  ) {
    const tagName =
      await labelled.evaluate(
        (
          element,
        ) =>
          element.tagName
            .toLowerCase(),
      );

    if (
      tagName ===
      "select"
    ) {
      await labelled.selectOption(
        value,
      );

      return;
    }

    const role =
      await labelled.getAttribute(
        "role",
      );

    if (
      role ===
      "combobox" ||
      tagName ===
      "button"
    ) {
      await labelled.click();

      const option =
        page
          .getByRole(
            "option",
            {
              name:
                optionPattern(
                  value,
                ),
            },
          )
          .first();

      if (
        await option.count()
      ) {
        await option.click();

        return;
      }
    }
  }

  const radio =
    page
      .locator(
        `input[name="${name}"][value="${value}"]:visible`,
      )
      .first();

  if (
    await radio.count()
  ) {
    await radio.check({
      force:
        true,
    });

    return;
  }

  const combobox =
    page
      .getByRole(
        "combobox",
        {
          name:
            labelPattern,
        },
      )
      .first();

  if (
    await combobox.count()
  ) {
    const tagName =
      await combobox.evaluate(
        (
          element,
        ) =>
          element.tagName
            .toLowerCase(),
      );

    if (
      tagName ===
      "select"
    ) {
      await combobox.selectOption(
        value,
      );

      return;
    }

    await combobox.click();

    const option =
      page
        .getByRole(
          "option",
          {
            name:
              optionPattern(
                value,
              ),
          },
        )
        .first();

    await expect(
      option,
    ).toBeVisible();

    await option.click();

    return;
  }

  const labelledChoice =
    page
      .getByText(
        optionPattern(
          value,
        ),
      )
      .filter({
        visible:
          true,
      })
      .first();

  if (
    await labelledChoice.count()
  ) {
    await labelledChoice.click();

    return;
  }

  const diagnostics =
    await page
      .locator(
        'select:visible, [role="combobox"]:visible, input[type="radio"]:visible',
      )
      .evaluateAll(
        (
          elements,
        ) =>
          elements.map(
            (
              element,
            ) => ({
              tag:
                element.tagName,

              name:
                element.getAttribute(
                  "name",
                ),

              value:
                element.getAttribute(
                  "value",
                ),

              text:
                element.textContent,
            }),
          ),
      );

  throw new Error(
    [
      `Could not resolve selection "${name}"="${value}".`,
      `Visible selection controls: ${JSON.stringify(
        diagnostics,
      )}`,
    ].join(
      "\n",
    ),
  );
}


async function selectProjectHorizon(
  page: Page,
  value: string,
): Promise<void> {
  const horizonText =
    new RegExp(
      `(?:^|\\b)${value}\\s*(?:month|months|mo)\\b`,
      "i",
    );

  const horizonLabel =
    /horizon|forecast horizon|forecast period|forecast length|planning horizon|projection period/i;


  async function hiddenStateValue(): Promise<
    string | null
  > {
    const hidden =
      page
        .locator(
          'input[type="hidden"][name="horizonMonths"]',
        )
        .first();

    if (
      await hidden.count() ===
      0
    ) {
      return null;
    }

    return hidden.inputValue();
  }


  async function verifySelected(): Promise<boolean> {
    const hiddenValue =
      await hiddenStateValue();

    if (
      hiddenValue !==
      null
    ) {
      return (
        hiddenValue ===
        value
      );
    }

    const checkedRadio =
      page.locator(
        `input[type="radio"][name="horizonMonths"][value="${value}"]:checked`,
      );

    if (
      await checkedRadio.count()
    ) {
      return true;
    }

    const selectedOption =
      page.locator(
        `select[name="horizonMonths"] option[value="${value}"]:checked`,
      );

    if (
      await selectedOption.count()
    ) {
      return true;
    }

    return false;
  }


  async function settleSelection(): Promise<boolean> {
    await page.waitForTimeout(
      120,
    );

    return verifySelected();
  }


  // ----------------------------------------------------------
  // The VentureScope wizard stores current horizon state in a
  // hidden input. If the requested value is already selected,
  // there is nothing for the browser to change.
  // ----------------------------------------------------------
  if (
    await verifySelected()
  ) {
    return;
  }


  for (
    let attempt =
      0;
    attempt <
      4;
    attempt +=
      1
  ) {
    // --------------------------------------------------------
    // Native named select.
    // --------------------------------------------------------
    const namedSelect =
      page
        .locator(
          'select[name="horizonMonths"]:visible',
        )
        .first();

    if (
      await namedSelect.count()
    ) {
      await namedSelect.selectOption(
        value,
      );

      if (
        await settleSelection()
      ) {
        return;
      }
    }


    // --------------------------------------------------------
    // Any visible native select containing the requested
    // horizon as an option. Supports wrappers that omit name.
    // --------------------------------------------------------
    const visibleSelects =
      page.locator(
        "select:visible",
      );

    const visibleSelectCount =
      await visibleSelects.count();

    for (
      let index =
        0;
      index <
        visibleSelectCount;
      index +=
        1
    ) {
      const select =
        visibleSelects.nth(
          index,
        );

      const matchingOption =
        select.locator(
          `option[value="${value}"]`,
        );

      if (
        await matchingOption.count()
      ) {
        await select.selectOption(
          value,
        );

        if (
          await settleSelection()
        ) {
          return;
        }
      }
    }


    // --------------------------------------------------------
    // Labelled native/custom control.
    // --------------------------------------------------------
    const labelled =
      page
        .getByLabel(
          horizonLabel,
        )
        .first();

    if (
      await labelled.count()
    ) {
      const tag =
        await labelled.evaluate(
          (
            element,
          ) =>
            element.tagName
              .toLowerCase(),
        );

      if (
        tag ===
        "select"
      ) {
        await labelled.selectOption(
          value,
        );

        if (
          await settleSelection()
        ) {
          return;
        }
      }
      else {
        const role =
          await labelled.getAttribute(
            "role",
          );

        if (
          role ===
            "combobox" ||
          tag ===
            "button"
        ) {
          await labelled.click();

          const option =
            page
              .getByRole(
                "option",
                {
                  name:
                    horizonText,
                },
              )
              .first();

          if (
            await option.count()
          ) {
            await option.click();

            if (
              await settleSelection()
            ) {
              return;
            }
          }
        }
      }
    }


    // --------------------------------------------------------
    // IMPORTANT:
    // only checkbox/radio inputs may use .check().
    //
    // The wizard also has:
    //
    // <input
    //   type="hidden"
    //   name="horizonMonths"
    //   value="..."
    // />
    //
    // That field represents state and must never be clicked.
    // --------------------------------------------------------
    const nativeRadio =
      page
        .locator(
          `input[type="radio"][name="horizonMonths"][value="${value}"]`,
        )
        .first();

    if (
      await nativeRadio.count()
    ) {
      await nativeRadio.check({
        force:
          true,
      });

      if (
        await settleSelection()
      ) {
        return;
      }
    }


    // --------------------------------------------------------
    // Accessible radio/card.
    // --------------------------------------------------------
    const roleRadio =
      page
        .getByRole(
          "radio",
          {
            name:
              horizonText,
          },
        )
        .first();

    if (
      await roleRadio.count()
    ) {
      await roleRadio.click();

      if (
        await settleSelection()
      ) {
        return;
      }
    }


    // --------------------------------------------------------
    // Button / segmented control.
    // --------------------------------------------------------
    const horizonButton =
      page
        .getByRole(
          "button",
          {
            name:
              horizonText,
          },
        )
        .first();

    if (
      await horizonButton.count()
    ) {
      await horizonButton.click();

      if (
        await settleSelection()
      ) {
        return;
      }
    }


    // --------------------------------------------------------
    // Visible labels/cards containing "36 months".
    // --------------------------------------------------------
    const candidates =
      page.locator(
        [
          "label:visible",
          'button:visible',
          '[role="radio"]:visible',
          '[role="option"]:visible',
          '[role="button"]:visible',
        ].join(
          ", ",
        ),
      );

    const candidateCount =
      await candidates.count();

    for (
      let index =
        0;
      index <
        candidateCount;
      index +=
        1
    ) {
      const candidate =
        candidates.nth(
          index,
        );

      const text =
        (
          await candidate
            .innerText()
            .catch(
              () => "",
            )
        )
          .trim();

      if (
        horizonText.test(
          text,
        )
      ) {
        await candidate.click();

        if (
          await settleSelection()
        ) {
          return;
        }
      }
    }


    // --------------------------------------------------------
    // Exact text nested inside a clickable parent.
    // --------------------------------------------------------
    const visibleText =
      page
        .getByText(
          horizonText,
        )
        .first();

    if (
      await visibleText.count()
    ) {
      const clickable =
        visibleText.locator(
          'xpath=ancestor-or-self::*[self::button or self::label or @role="button" or @role="radio" or @role="option"][1]',
        );

      if (
        await clickable.count()
      ) {
        await clickable.click();

        if (
          await settleSelection()
        ) {
          return;
        }
      }
    }


    // --------------------------------------------------------
    // Horizon may exist on the following wizard step.
    // --------------------------------------------------------
    if (
      attempt <
      3
    ) {
      const advance =
        page
          .getByRole(
            "button",
            {
              name:
                /continue|next|forecast|model setup|revenue model/i,
            },
          )
          .first();

      if (
        await advance.count()
      ) {
        if (
          !await advance.isDisabled()
        ) {
          await advance.click();

          await page.waitForTimeout(
            180,
          );

          if (
            await verifySelected()
          ) {
            return;
          }

          continue;
        }
      }
    }


    break;
  }


  const state =
    await hiddenStateValue();

  const controls =
    await page
      .locator(
        [
          "select:visible",
          "button:visible",
          "label:visible",
          '[role="combobox"]:visible',
          '[role="radio"]:visible',
          '[role="option"]:visible',
        ].join(
          ", ",
        ),
      )
      .evaluateAll(
        (
          elements,
        ) =>
          elements
            .slice(
              0,
              100,
            )
            .map(
              (
                element,
              ) => ({
                tag:
                  element.tagName,

                name:
                  element.getAttribute(
                    "name",
                  ),

                role:
                  element.getAttribute(
                    "role",
                  ),

                value:
                  element.getAttribute(
                    "value",
                  ),

                text:
                  element.textContent
                    ?.trim()
                    .replace(
                      /\\s+/g,
                      " ",
                    )
                    .slice(
                      0,
                      180,
                    ),
              }),
            ),
      );


  throw new Error(
    [
      `Could not select project horizon "${value}" months.`,
      `Current hidden horizon state: ${JSON.stringify(
        state,
      )}`,
      `Visible wizard controls: ${JSON.stringify(
        controls,
      )}`,
    ].join(
      "\n",
    ),
  );
}


async function selectProjectRevenueMode(
  page: Page,
  value:
    "DIRECT" |
    "CUSTOMER_DRIVEN",
): Promise<void> {
  const desiredLabel =
    value ===
    "CUSTOMER_DRIVEN"
      ? /customer.?driven|customer model|customers/i
      : /direct revenue|direct model|direct/i;


  async function hiddenStateValue(): Promise<
    string | null
  > {
    const hidden =
      page
        .locator(
          'input[type="hidden"][name="revenueMode"]',
        )
        .first();

    if (
      await hidden.count() ===
      0
    ) {
      return null;
    }

    return hidden.inputValue();
  }


  async function verifySelected(): Promise<boolean> {
    const hidden =
      await hiddenStateValue();

    if (
      hidden !==
      null
    ) {
      return (
        hidden ===
        value
      );
    }


    const selectedNative =
      page.locator(
        `select[name="revenueMode"] option[value="${value}"]:checked`,
      );

    if (
      await selectedNative.count()
    ) {
      return true;
    }


    const checkedRadio =
      page.locator(
        `input[type="radio"][name="revenueMode"][value="${value}"]:checked`,
      );

    if (
      await checkedRadio.count()
    ) {
      return true;
    }


    const selectedRole =
      page
        .getByRole(
          "radio",
          {
            name:
              desiredLabel,
          },
        )
        .first();

    if (
      await selectedRole.count()
    ) {
      const checked =
        await selectedRole.getAttribute(
          "aria-checked",
        );

      if (
        checked ===
        "true"
      ) {
        return true;
      }
    }


    const pressedButton =
      page
        .getByRole(
          "button",
          {
            name:
              desiredLabel,
          },
        )
        .first();

    if (
      await pressedButton.count()
    ) {
      const pressed =
        await pressedButton.getAttribute(
          "aria-pressed",
        );

      if (
        pressed ===
        "true"
      ) {
        return true;
      }
    }


    return false;
  }


  async function settleSelection(): Promise<boolean> {
    await page.waitForTimeout(
      120,
    );

    return verifySelected();
  }


  // ----------------------------------------------------------
  // VentureScope's wizard stores this selection in a hidden
  // field. If it already equals the requested mode, accept it.
  // Do not interact with the hidden state input.
  // ----------------------------------------------------------
  if (
    await verifySelected()
  ) {
    return;
  }


  // ----------------------------------------------------------
  // Native named select.
  // ----------------------------------------------------------
  const namedSelect =
    page
      .locator(
        'select[name="revenueMode"]:visible',
      )
      .first();

  if (
    await namedSelect.count()
  ) {
    await namedSelect.selectOption(
      value,
    );

    if (
      await settleSelection()
    ) {
      return;
    }
  }


  // ----------------------------------------------------------
  // Visible select whose option values contain DIRECT /
  // CUSTOMER_DRIVEN even when the select has no name.
  // ----------------------------------------------------------
  const visibleSelects =
    page.locator(
      "select:visible",
    );

  const selectCount =
    await visibleSelects.count();

  for (
    let index =
      0;
    index <
      selectCount;
    index +=
      1
  ) {
    const select =
      visibleSelects.nth(
        index,
      );

    if (
      await select
        .locator(
          `option[value="${value}"]`,
        )
        .count()
    ) {
      await select.selectOption(
        value,
      );

      if (
        await settleSelection()
      ) {
        return;
      }
    }
  }


  // ----------------------------------------------------------
  // Real native radio only.
  // The hidden wizard-state input must never reach .check().
  // ----------------------------------------------------------
  const radio =
    page
      .locator(
        `input[type="radio"][name="revenueMode"][value="${value}"]`,
      )
      .first();

  if (
    await radio.count()
  ) {
    await radio.check({
      force:
        true,
    });

    if (
      await settleSelection()
    ) {
      return;
    }
  }


  // ----------------------------------------------------------
  // Accessible radio/card.
  // ----------------------------------------------------------
  const accessibleRadio =
    page
      .getByRole(
        "radio",
        {
          name:
            desiredLabel,
        },
      )
      .first();

  if (
    await accessibleRadio.count()
  ) {
    await accessibleRadio.click();

    if (
      await settleSelection()
    ) {
      return;
    }
  }


  // ----------------------------------------------------------
  // Button/card implementation.
  // ----------------------------------------------------------
  const button =
    page
      .getByRole(
        "button",
        {
          name:
            desiredLabel,
        },
      )
      .first();

  if (
    await button.count()
  ) {
    await button.click();

    if (
      await settleSelection()
    ) {
      return;
    }
  }


  // ----------------------------------------------------------
  // A visible label or clickable card containing the mode.
  // ----------------------------------------------------------
  const candidates =
    page.locator(
      [
        "label:visible",
        "button:visible",
        '[role="radio"]:visible',
        '[role="button"]:visible',
      ].join(
        ", ",
      ),
    );

  const candidateCount =
    await candidates.count();

  for (
    let index =
      0;
    index <
      candidateCount;
    index +=
      1
  ) {
    const candidate =
      candidates.nth(
        index,
      );

    const text =
      (
        await candidate
          .innerText()
          .catch(
            () => "",
          )
      ).trim();

    if (
      desiredLabel.test(
        text,
      )
    ) {
      await candidate.click();

      if (
        await settleSelection()
      ) {
        return;
      }
    }
  }


  const state =
    await hiddenStateValue();

  const controls =
    await page
      .locator(
        [
          "select:visible",
          "button:visible",
          "label:visible",
          '[role="radio"]:visible',
          '[role="button"]:visible',
        ].join(
          ", ",
        ),
      )
      .evaluateAll(
        (
          elements,
        ) =>
          elements
            .slice(
              0,
              100,
            )
            .map(
              (
                element,
              ) => ({
                tag:
                  element.tagName,

                name:
                  element.getAttribute(
                    "name",
                  ),

                role:
                  element.getAttribute(
                    "role",
                  ),

                value:
                  element.getAttribute(
                    "value",
                  ),

                ariaChecked:
                  element.getAttribute(
                    "aria-checked",
                  ),

                ariaPressed:
                  element.getAttribute(
                    "aria-pressed",
                  ),

                text:
                  element.textContent
                    ?.trim()
                    .replace(
                      /\s+/g,
                      " ",
                    )
                    .slice(
                      0,
                      180,
                    ),
              }),
            ),
      );


  throw new Error(
    [
      `Could not select project revenue mode "${value}".`,
      `Current hidden revenueMode state: ${JSON.stringify(
        state,
      )}`,
      `Visible wizard controls: ${JSON.stringify(
        controls,
      )}`,
    ].join(
      "\n",
    ),
  );
}


async function register(
  page: Page,
  credentials: Credentials,
): Promise<void> {
  await page.goto(
    "/register",
  );

  await fillInput(
    page,
    "name",
    credentials.name,
  );

  await fillInput(
    page,
    "email",
    credentials.email,
  );

  await fillInput(
    page,
    "password",
    credentials.password,
  );

  await fillInput(
    page,
    "confirmPassword",
    credentials.password,
  );

  const form =
    page
      .locator(
        "form",
      )
      .filter({
        has:
          page.locator(
            'input[name="confirmPassword"]',
          ),
      })
      .first();

  await submitForm(
    form,
  );

  await settle(
    page,
  );
}

async function login(
  page: Page,
  credentials: Credentials,
): Promise<void> {
  await page.goto(
    "/login",
  );

  if (
    page.url().includes(
      "/dashboard",
    )
  ) {
    return;
  }

  await fillInput(
    page,
    "email",
    credentials.email,
  );

  await fillInput(
    page,
    "password",
    credentials.password,
  );

  const form =
    page
      .locator(
        "form",
      )
      .filter({
        has:
          page.locator(
            'input[name="password"]',
          ),
      })
      .first();

  await submitForm(
    form,
  );

  await page.waitForURL(
    /\/dashboard(?:\?.*)?$/,
    {
      timeout:
        15_000,
    },
  );
}

async function registerAndLogin(
  page: Page,
  credentials: Credentials,
): Promise<void> {
  await register(
    page,
    credentials,
  );

  if (
    page.url().includes(
      "/dashboard",
    )
  ) {
    return;
  }

  await login(
    page,
    credentials,
  );
}

async function logout(
  page: Page,
): Promise<void> {
  await page.goto(
    "/dashboard",
  );

  let logoutControl =
    page
      .locator(
        "button, a",
      )
      .filter({
        hasText:
          /sign out|log out|logout/i,
      })
      .first();

  if (
    await logoutControl.count() ===
    0
  ) {
    const menuTrigger =
      page
        .locator(
          'button[aria-haspopup="menu"]',
        )
        .first();

    if (
      await menuTrigger.count()
    ) {
      await menuTrigger.click();

      logoutControl =
        page
          .locator(
            "button, a, [role=menuitem]",
          )
          .filter({
            hasText:
              /sign out|log out|logout/i,
          })
          .first();
    }
  }

  await expect(
    logoutControl,
  ).toBeVisible();

  await logoutControl.click();

  await settle(
    page,
  );

  await page.goto(
    "/dashboard",
  );

  await expect(
    page,
  ).toHaveURL(
    /\/login/,
  );
}

async function createProject(
  page: Page,
  projectName: string,
): Promise<string> {
  await page.goto(
    "/projects/new",
  );

  // Some wizard implementations begin with an introductory
  // screen before rendering the project-details controls.
  // Advance only while no user-editable project-name field exists.
  for (
    let attempt =
      0;
    attempt <
      3;
    attempt +=
      1
  ) {
    const labelledName =
      page
        .getByLabel(
          /project name|company name|business name|venture name|name/i,
        )
        .first();

    const visibleText =
      page.locator(
        'main input[type="text"]:visible, main input:not([type]):visible',
      );

    if (
      await labelledName.count() ||
      await visibleText.count()
    ) {
      break;
    }

    const advance =
      page
        .getByRole(
          "button",
          {
            name:
              /start|begin|continue|next|get started|create project|set up/i,
          },
        )
        .first();

    if (
      await advance.count() ===
      0
    ) {
      break;
    }

    await advance.click();

    await page.waitForTimeout(
      150,
    );
  }

  await fillInput(
    page,
    "name",
    projectName,
  );

  await fillInputIfPresent(
    page,
    "industry",
    "B2B SaaS",
  );

  await selectValue(
    page,
    "currency",
    "EUR",
  );

  await fillInput(
    page,
    "startMonth",
    "2027-01",
  );

  await selectProjectHorizon(
    page,
    "36",
  );

  const nextButton =
    page
      .getByRole(
        "button",
        {
          name:
            /continue|next|revenue model/i,
        },
      )
      .first();

  if (
    await nextButton.count()
  ) {
    await nextButton.click();
  }

  await page.waitForTimeout(
    150,
  );

  await selectProjectRevenueMode(
    page,
    "CUSTOMER_DRIVEN",
  );

  const createButton =
    page
      .getByRole(
        "button",
        {
          name:
            /create|finish|build model/i,
        },
      )
      .last();

  if (
    await createButton.count()
  ) {
    await createButton.click();
  }
  else {
    const form =
      page
        .locator(
          "form",
        )
        .filter({
          has:
            page.locator(
              'input[name="startMonth"]',
            ),
        })
        .first();

    await submitForm(
      form,
    );
  }

  await page.waitForURL(
    /\/projects\/[^/]+\/overview(?:\?.*)?$/,
    {
      timeout:
        20_000,
    },
  );

  const match =
    page
      .url()
      .match(
        /\/projects\/([^/]+)\/overview/,
      );

  if (!match) {
    throw new Error(
      "Could not determine created project ID.",
    );
  }

  return match[1];
}

async function saveFormContaining(
  page: Page,
  selector: string,
): Promise<void> {
  const form =
    page
      .locator(
        "form",
      )
      .filter({
        has:
          page.locator(
            selector,
          ),
      })
      .first();

  await expect(
    form,
  ).toBeVisible();

  await submitForm(
    form,
  );

  await settle(
    page,
  );
}

async function configureFinancialModel(
  page: Page,
  projectId: string,
): Promise<void> {
  await page.goto(
    `/projects/${projectId}/assumptions`,
  );

  await fillInput(
    page,
    "startingCash",
    "300000",
  );

  await fillInput(
    page,
    "corporateTaxRate",
    "25",
  );

  await saveFormContaining(
    page,
    'input[name="startingCash"]',
  );

  await page.goto(
    `/projects/${projectId}/revenue`,
  );

  await fillInput(
    page,
    "startingCustomers",
    "250",
  );

  await fillInput(
    page,
    "arpu",
    "125",
  );

  await fillInput(
    page,
    "monthlyChurnRate",
    "3",
  );

  await fillInput(
    page,
    "cac",
    "180",
  );

  await fillInput(
    page,
    "organicNewCustomers",
    "15",
  );

  await fillInput(
    page,
    "customerAcquisitionGrowthRate",
    "1",
  );

  await fillInput(
    page,
    "arpuGrowthRate",
    "0.25",
  );

  await fillInput(
    page,
    "monthlyOneTimeRevenue",
    "2500",
  );

  await saveFormContaining(
    page,
    'input[name="startingCustomers"]',
  );

  await page.goto(
    `/projects/${projectId}/expenses`,
  );

  await selectValue(
    page,
    "cogsMethod",
    "PERCENTAGE",
  );


  const expenseInputs: Array<
    [
      string,
      string,
    ]
  > = [
    [
      "salariesMonthly",
      "35000",
    ],

    [
      "salaryAnnualGrowthRate",
      "8",
    ],

    [
      "rentMonthly",
      "5000",
    ],

    [
      "rentAnnualGrowthRate",
      "3",
    ],

    [
      "marketingMonthly",
      "18000",
    ],

    [
      "marketingGrowthRate",
      "1",
    ],

    [
      "cogsPercentage",
      "15",
    ],

    [
      "software",
      "3500",
    ],

    [
      "professionalServices",
      "2000",
    ],

    [
      "insurance",
      "1000",
    ],

    [
      "utilities",
      "800",
    ],

    [
      "travel",
      "1500",
    ],

    [
      "other",
      "750",
    ],
  ];

  for (
    const [
      name,
      value,
    ]
    of expenseInputs
  ) {
    await fillInput(
      page,
      name,
      value,
    );
  }

  await selectValue(
    page,
    "marketingGrowthPeriod",
    "MONTHLY",
  );

  await saveFormContaining(
    page,
    'input[name="salariesMonthly"]',
  );

  await page.goto(
    `/projects/${projectId}/overview`,
  );

  await expect(
    page.getByText(
      "Revenue vs expenses",
      {
        exact:
          true,
      },
    ),
  ).toBeVisible({
    timeout:
      15_000,
  });
}

async function addDebtFinancing(
  page: Page,
  projectId: string,
): Promise<void> {
  await page.goto(
    `/projects/${projectId}/financing`,
  );

  const form =
    page
      .locator(
        "form",
      )
      .filter({
        has:
          page.locator(
            'input[name="amount"]',
          ),
      })
      .first();

  await form
    .locator(
      'input[name="name"]',
    )
    .fill(
      "E2E Growth Loan",
    );

  await form
    .locator(
      'select[name="type"]',
    )
    .selectOption(
      "DEBT",
    );

  await form
    .locator(
      'input[name="month"]',
    )
    .fill(
      "2027-06",
    );

  await form
    .locator(
      'input[name="amount"]',
    )
    .fill(
      "120000",
    );

  await form
    .locator(
      'input[name="apr"]',
    )
    .fill(
      "6",
    );

  await form
    .locator(
      'input[name="termMonths"]',
    )
    .fill(
      "24",
    );

  await form
    .locator(
      'input[name="repaymentStartMonth"]',
    )
    .fill(
      "2027-07",
    );

  await submitForm(
    form,
  );

  await settle(
    page,
  );

  await expect(
    page.getByText(
      "E2E Growth Loan",
      {
        exact:
          true,
      },
    ),
  ).toBeVisible();
}

async function createCustomScenario(
  page: Page,
  projectId: string,
): Promise<void> {
  await page.goto(
    `/projects/${projectId}/scenarios`,
  );

  await page
    .getByRole(
      "button",
      {
        name:
          /add scenario/i,
      },
    )
    .click();

  const dialog =
    page
      .getByRole(
        "dialog",
      )
      .first();

  await expect(
    dialog,
  ).toBeVisible();

  const form =
    dialog.locator(
      "form",
    );

  await form
    .locator(
      'input[name="name"]',
    )
    .fill(
      "E2E Expansion",
    );

  await form
    .locator(
      'input[name="growthAdjustmentPercentage"]',
    )
    .fill(
      "15",
    );

  await form
    .locator(
      'input[name="arpuAdjustmentPercentage"]',
    )
    .fill(
      "5",
    );

  await form
    .locator(
      'input[name="cacAdjustmentPercentage"]',
    )
    .fill(
      "-5",
    );

  await form
    .locator(
      'input[name="churnDeltaPercentagePoints"]',
    )
    .fill(
      "-0.5",
    );

  await form
    .locator(
      'input[name="cogsDeltaPercentagePoints"]',
    )
    .fill(
      "-1",
    );

  await submitForm(
    form,
  );

  await settle(
    page,
  );

  await expect(
    page.getByText(
      "Custom scenario created.",
    ),
  ).toBeVisible();
}

async function addMonthlyOverride(
  page: Page,
  projectId: string,
): Promise<void> {
  await page.goto(
    `/projects/${projectId}/timeline`,
  );

  const form =
    page
      .locator(
        "form",
      )
      .filter({
        has:
          page.locator(
            'input[name="month"]',
          ),
      })
      .first();

  await form
    .locator(
      'input[name="month"]',
    )
    .fill(
      "2027-09",
    );

  const scenarioSelect =
    form.locator(
      'select[name="scenarioId"]',
    );

  await scenarioSelect.selectOption(
    "",
  );

  await form
    .locator(
      'input[name="revenue"]',
    )
    .fill(
      "175000",
    );

  await form
    .locator(
      'input[name="marketing"]',
    )
    .fill(
      "45000",
    );

  await form
    .locator(
      'input[name="note"]',
    )
    .fill(
      "E2E product launch",
    );

  await submitForm(
    form,
  );

  await settle(
    page,
  );

  const persistedOverrideNote =
    page
      .getByText(
        "E2E product launch",
        {
          exact:
            true,
        },
      )
      .first();

  await expect(
    persistedOverrideNote,
  ).toBeVisible();
}

async function verifyReportsAndExports(
  page: Page,
  context: BrowserContext,
  projectId: string,
  projectName: string,
): Promise<void> {
  await page.goto(
    `/projects/${projectId}/reports`,
  );

  await expect(
    page.getByRole(
      "heading",
      {
        name:
          "Executive report",
      },
    ),
  ).toBeVisible();

  await expect(
    page.getByRole(
      "link",
      {
        name:
          /export csv/i,
      },
    ),
  ).toBeVisible();

  await expect(
    page.getByRole(
      "link",
      {
        name:
          /export pdf/i,
      },
    ),
  ).toBeVisible();

  const origin =
    new URL(
      page.url(),
    ).origin;

  const csvResponse =
    await context.request.get(
      `${origin}/api/projects/${projectId}/export/csv`,
    );

  expect(
    csvResponse.status(),
  ).toBe(
    200,
  );

  expect(
    csvResponse.headers()[
      "content-type"
    ],
  ).toContain(
    "text/csv",
  );

  const csv =
    await csvResponse.text();

  expect(
    csv,
  ).toContain(
    "project_name",
  );

  expect(
    csv,
  ).toContain(
    projectName,
  );

  expect(
    csv,
  ).toContain(
    "ending_cash",
  );

  const pdfResponse =
    await context.request.get(
      `${origin}/api/projects/${projectId}/export/pdf`,
    );

  expect(
    pdfResponse.status(),
  ).toBe(
    200,
  );

  expect(
    pdfResponse.headers()[
      "content-type"
    ],
  ).toContain(
    "application/pdf",
  );

  const pdf =
    await pdfResponse.body();

  expect(
    pdf.subarray(
      0,
      4,
    ).toString(
      "ascii",
    ),
  ).toBe(
    "%PDF",
  );
}

async function renameProject(
  page: Page,
  projectId: string,
  newName: string,
): Promise<void> {
  await page.goto(
    `/projects/${projectId}/settings`,
  );

  const form =
    page
      .locator(
        "form",
      )
      .filter({
        has:
          page.locator(
            'select[name="horizonMonths"]',
          ),
      })
      .first();

  await form
    .locator(
      'input[name="name"]',
    )
    .fill(
      newName,
    );

  await submitForm(
    form,
  );

  await settle(
    page,
  );

  await expect(
    page.getByText(
      /Project settings saved/,
    ),
  ).toBeVisible();

  await page.goto(
    `/projects/${projectId}/overview`,
  );

  const primaryProjectHeading =
    page
      .getByRole(
        "heading",
        {
          name:
            newName,

          level:
            1,
        },
      )
      .first();

  await expect(
    primaryProjectHeading,
  ).toBeVisible();
}

async function deleteProjectFromDashboard(
  page: Page,
  projectName: string,
): Promise<void> {
  await page.goto(
    "/dashboard",
  );

  const projectTitle =
    page.getByText(
      projectName,
      {
        exact:
          true,
      },
    );

  await expect(
    projectTitle,
  ).toBeVisible();

  const card =
    projectTitle.locator(
      'xpath=ancestor::*[.//button][1]',
    );

  const menuTrigger =
    card
      .locator(
        "button",
      )
      .last();

  await expect(
    menuTrigger,
  ).toBeVisible();

  await menuTrigger.click();

  let deleteItem =
    page
      .getByRole(
        "menuitem",
        {
          name:
            /delete/i,
        },
      )
      .last();

  if (
    await deleteItem.count() ===
    0
  ) {
    deleteItem =
      page
        .getByText(
          /^Delete$/,
        )
        .last();
  }

  await expect(
    deleteItem,
  ).toBeVisible();

  await deleteItem.click();

  const dialog =
    page
      .getByRole(
        "alertdialog",
      )
      .last();

  await expect(
    dialog,
  ).toBeVisible();

  const confirm =
    dialog
      .getByRole(
        "button",
        {
          name:
            /delete/i,
        },
      )
      .last();

  await expect(
    confirm,
  ).toBeVisible();

  await confirm.click();

  await settle(
    page,
  );

  await expect(
    page.getByText(
      projectName,
      {
        exact:
          true,
      },
    ),
  ).toHaveCount(
    0,
  );
}

test.describe(
  "VentureScope browser security and product flows",
  () => {
    test(
      "public demo is available without authentication",
      async ({
        page,
      }) => {
        const response =
          await page.goto(
            "/demo",
          );

        expect(
          response?.status(),
        ).toBe(
          200,
        );

        await expect(
          page.getByText(
            "ORBIT ANALYTICS",
            {
              exact:
                true,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "PUBLIC DEMO",
            {
              exact:
                true,
            },
          ),
        ).toBeVisible();

        await page
          .getByRole(
            "link",
            {
              name:
                "Bull Case",
            },
          )
          .click();

        await expect(
          page,
        ).toHaveURL(
          /scenario=demo-bull/,
        );

        await expect(
          page.getByText(
            "Current view:",
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "Bull Case",
            {
              exact:
                true,
            },
          ).first(),
        ).toBeVisible();
      },
    );

    test(
      "protected pages and exports reject anonymous access",
      async ({
        page,
        request,
      }) => {
        await page.goto(
          "/dashboard",
        );

        await expect(
          page,
        ).toHaveURL(
          /\/login/,
        );

        await page.goto(
          "/projects/not-a-real-project/overview",
        );

        await expect(
          page,
        ).toHaveURL(
          /\/login/,
        );

        const csv =
          await request.get(
            "/api/projects/not-a-real-project/export/csv",
          );

        expect(
          csv.status(),
        ).toBe(
          401,
        );

        const pdf =
          await request.get(
            "/api/projects/not-a-real-project/export/pdf",
          );

        expect(
          pdf.status(),
        ).toBe(
          401,
        );
      },
    );

    test(
      "registration, login and logout protect the private workspace",
      async ({
        page,
      }) => {
        const user =
          uniqueCredentials(
            "auth",
          );

        await registerAndLogin(
          page,
          user,
        );

        await expect(
          page,
        ).toHaveURL(
          /\/dashboard/,
        );

        await logout(
          page,
        );

        await expect(
          page,
        ).toHaveURL(
          /\/login/,
        );

        await login(
          page,
          user,
        );

        await expect(
          page,
        ).toHaveURL(
          /\/dashboard/,
        );
      },
    );

    test(
      "owner can complete the full financial-planning workflow",
      async ({
        page,
        context,
      }) => {
        const user =
          uniqueCredentials(
            "owner-flow",
          );

        const originalName =
          `E2E Venture ${Date.now()}`;

        const renamed =
          `${originalName} Renamed`;

        await registerAndLogin(
          page,
          user,
        );

        const projectId =
          await createProject(
            page,
            originalName,
          );

        await expect(
          page,
        ).toHaveURL(
          new RegExp(
            `/projects/${projectId}/overview`,
          ),
        );

        await configureFinancialModel(
          page,
          projectId,
        );

        await addDebtFinancing(
          page,
          projectId,
        );

        await createCustomScenario(
          page,
          projectId,
        );

        await addMonthlyOverride(
          page,
          projectId,
        );

        await page.goto(
          `/projects/${projectId}/forecast`,
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Financial forecast",
            },
          ),
        ).toBeVisible();

        await page.goto(
          `/projects/${projectId}/pnl`,
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Profit & loss",
            },
          ),
        ).toBeVisible();

        await page.goto(
          `/projects/${projectId}/cash-flow`,
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Simplified cash-flow forecast",
            },
          ),
        ).toBeVisible();

        await page.goto(
          `/projects/${projectId}/customers`,
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                "Customer analytics",
            },
          ),
        ).toBeVisible();

        await verifyReportsAndExports(
          page,
          context,
          projectId,
          originalName,
        );

        await renameProject(
          page,
          projectId,
          renamed,
        );

        await deleteProjectFromDashboard(
          page,
          renamed,
        );
      },
    );

    test(
      "cross-user project access and exports are isolated",
      async ({
        browser,
      }) => {
        const owner =
          uniqueCredentials(
            "idor-owner",
          );

        const attacker =
          uniqueCredentials(
            "idor-attacker",
          );

        const ownerContext =
          await browser.newContext();

        const attackerContext =
          await browser.newContext();

        try {
          const ownerPage =
            await ownerContext.newPage();

          const attackerPage =
            await attackerContext.newPage();

          await registerAndLogin(
            ownerPage,
            owner,
          );

          const projectId =
            await createProject(
              ownerPage,
              `Private E2E ${Date.now()}`,
            );

          await registerAndLogin(
            attackerPage,
            attacker,
          );

          const forbiddenPage =
            await attackerPage.goto(
              `/projects/${projectId}/overview`,
            );

          expect(
            forbiddenPage?.status(),
          ).toBe(
            404,
          );

          const origin =
            new URL(
              attackerPage.url(),
            ).origin;

          const routes = [
            `/api/projects/${projectId}/export/csv`,
            `/api/projects/${projectId}/export/pdf`,
          ];

          for (
            const route
            of routes
          ) {
            const response =
              await attackerContext
                .request
                .get(
                  `${origin}${route}`,
                );

            expect(
              response.status(),
            ).toBe(
              404,
            );
          }

          const ownerOverview =
            await ownerPage.goto(
              `/projects/${projectId}/overview`,
            );

          expect(
            ownerOverview?.status(),
          ).toBe(
            200,
          );
        }
        finally {
          await ownerContext.close();
          await attackerContext.close();
        }
      },
    );
  },
);
