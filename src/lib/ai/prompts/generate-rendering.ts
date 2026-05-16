import type { RenovationScenario } from '@/types/renovation';
import type { RenderingType } from '@/types/rendering';

const VIEW_CONTEXT: Record<RenderingType, { label: string; angle: string }> = {
  exterior_front: {
    label: 'front facade',
    angle: 'front elevation, ground-level perspective',
  },
  exterior_rear: {
    label: 'rear facade',
    angle: 'rear elevation showing garden side',
  },
  courtyard: {
    label: 'courtyard',
    angle: 'courtyard view looking inward at the estate',
  },
  interior_living: {
    label: 'living room',
    angle: 'interior wide-angle of the main living space',
  },
  interior_kitchen: {
    label: 'kitchen',
    angle: 'interior view of the kitchen',
  },
  interior_airbnb: {
    label: 'guest apartment',
    angle: 'interior view of the guest suite',
  },
  aerial: {
    label: 'aerial',
    angle: 'drone perspective looking down at the estate',
  },
};

function getEnabledFarmFeatures(scenario: RenovationScenario): string[] {
  const elements: string[] = [];
  for (const f of scenario.farm_features) {
    if (!f.enabled) continue;
    switch (f.type) {
      case 'chickens':
        elements.push('a charming chicken coop set away from the guest areas');
        break;
      case 'goats':
        elements.push('a small fenced paddock with goats at a distance from the main house');
        break;
      case 'pizza_oven':
        elements.push('a wood-fired pizza oven with a rustic stone surround near the outdoor dining area');
        break;
      case 'olive_grove':
        elements.push('mature olive trees with cleared ground and gravel paths winding beneath them');
        break;
      case 'vegetable_garden':
        elements.push('a kitchen garden with raised stone beds, herbs, and seasonal vegetables');
        break;
      case 'wine_cellar':
        elements.push('a wine-tasting courtyard area with rustic tables, chairs, a wooden pergola draped in climbing vines, and string lights overhead');
        break;
      case 'courtyard':
        elements.push('a stone-paved courtyard with a pergola, outdoor dining table, and climbing wisteria or bougainvillea');
        break;
    }
  }
  return elements;
}

function getRenovationDetails(scenario: RenovationScenario): {
  roof: string[];
  walls: string[];
  windows: string[];
  grounds: string[];
  interiors: string[];
  systems: string[];
} {
  const roof: string[] = [];
  const walls: string[] = [];
  const windows: string[] = [];
  const grounds: string[] = [];
  const interiors: string[] = [];
  const systems: string[] = [];

  for (const phase of scenario.phases) {
    for (const li of phase.line_items) {
      const desc = li.description.toLowerCase();
      const key = li.key.toLowerCase();

      if (key.includes('roof') || desc.includes('roof') || desc.includes('tetto') || desc.includes('coppi')) {
        roof.push(li.description);
      } else if (key.includes('wall') || key.includes('facade') || key.includes('plaster') ||
                 desc.includes('wall') || desc.includes('facade') || desc.includes('intonaco') ||
                 desc.includes('masonry') || desc.includes('stone') || desc.includes('repoint')) {
        walls.push(li.description);
      } else if (key.includes('window') || key.includes('shutter') || key.includes('door') ||
                 desc.includes('window') || desc.includes('shutter') || desc.includes('door') ||
                 desc.includes('finestra') || desc.includes('porta') || desc.includes('persiane')) {
        windows.push(li.description);
      } else if (key.includes('garden') || key.includes('courtyard') || key.includes('land') ||
                 key.includes('pool') || key.includes('terrace') || key.includes('path') ||
                 desc.includes('garden') || desc.includes('courtyard') || desc.includes('paving') ||
                 desc.includes('pool') || desc.includes('terrace') || desc.includes('landscap')) {
        grounds.push(li.description);
      } else if (key.includes('kitchen') || key.includes('bath') || key.includes('floor') ||
                 desc.includes('kitchen') || desc.includes('bath') || desc.includes('floor') ||
                 desc.includes('tile') || desc.includes('plaster') || desc.includes('ceiling')) {
        interiors.push(li.description);
      } else if (key.includes('electric') || key.includes('plumb') || key.includes('heat') ||
                 key.includes('solar') || desc.includes('electric') || desc.includes('plumb') ||
                 desc.includes('heating') || desc.includes('solar') || desc.includes('water')) {
        systems.push(li.description);
      }
    }
  }

  return { roof, walls, windows, grounds, interiors, systems };
}

function isExteriorOrAerial(type: RenderingType): boolean {
  return ['exterior_front', 'exterior_rear', 'courtyard', 'aerial'].includes(type);
}

function isInterior(type: RenderingType): boolean {
  return ['interior_living', 'interior_kitchen', 'interior_airbnb'].includes(type);
}

function buildExteriorPrompt(
  scenario: RenovationScenario,
  renderingType: RenderingType,
  additionalInstructions?: string,
): string {
  const view = VIEW_CONTEXT[renderingType];
  const details = getRenovationDetails(scenario);
  const farmElements = getEnabledFarmFeatures(scenario);
  const isLifestyle = scenario.type === 'lifestyle' || scenario.type === 'high_end';
  const budget = Math.round((scenario.renovation_total_min + scenario.renovation_total_max) / 2000) * 1000;
  const budgetLabel = budget >= 1000 ? `€${Math.round(budget / 1000)}k` : `€${budget}`;

  const lines: string[] = [];

  lines.push(
    `Transform this ${view.label} photo of the rural Italian farmhouse into a photorealistic blue-hour renovation rendering.`,
  );
  lines.push(
    `Preserve the exact farmhouse structure, rooflines, ${renderingType === 'aerial' ? 'drone angle' : 'camera angle'}, and countryside setting, but show the estate fully renovated after a serious ${budgetLabel} restoration.`,
  );
  lines.push('Historic exterior, modern comfort inside.');
  lines.push('');

  lines.push('BUILDING RESTORATION:');
  if (details.roof.length > 0) {
    lines.push(`- Roof: ${details.roof.join('; ')}. Fresh terracotta coppi tiles, clean ridge lines.`);
  } else {
    lines.push('- Roof: refreshed terracotta coppi tiles, repaired ridge lines, no missing or damaged tiles.');
  }
  if (details.walls.length > 0) {
    lines.push(`- Walls: ${details.walls.join('; ')}. Clean restored stone and brick, repointed mortar, warm natural tones.`);
  } else {
    lines.push('- Walls: restored stone and brick walls, repointed mortar joints, clean warm natural tones.');
  }
  if (details.windows.length > 0) {
    lines.push(`- Windows & doors: ${details.windows.join('; ')}. Painted wooden shutters in sage green, solid timber doors.`);
  } else {
    lines.push('- Windows & doors: new painted wooden shutters in sage green or muted olive, solid timber entry doors, warm light glowing from inside.');
  }
  lines.push('- Lighting: exterior wall-mounted lanterns on warm white, subtle uplighting on key architectural features.');
  lines.push('');

  lines.push('GROUNDS & LANDSCAPING:');
  if (details.grounds.length > 0) {
    lines.push(`- Hardscape: ${details.grounds.join('; ')}.`);
  }
  lines.push('- Gravel courtyard with natural edges, low dry-stone walls, cypress trees framing the approach.');
  lines.push('- Mediterranean plantings: olive trees, lavender borders, rosemary bushes, terracotta pots with herbs.');

  if (isLifestyle) {
    lines.push('- Warm Airbnb wine-tasting courtyard beside the house with rustic wooden tables, iron chairs, pergola with climbing vines, and string lights overhead.');
    lines.push('- Separate private owner seating area farther away, more secluded, with comfortable chairs and a small table.');
  }
  lines.push('- Refined landscape lighting along paths and garden features.');
  lines.push('');

  if (farmElements.length > 0) {
    lines.push('FARM ELEMENTS:');
    for (const el of farmElements) {
      lines.push(`- ${el}`);
    }
    lines.push('');
  }

  lines.push('VEHICLES & LIFE:');
  lines.push('- Park a Volvo XC60 and Toyota Hilux discreetly near the edge of the gravel courtyard, partially softened by landscaping.');
  lines.push('');

  lines.push('ATMOSPHERE:');
  lines.push('- Early spring, rolling green Italian hills, dusk / blue-hour atmosphere.');
  lines.push('- Warm interior lights glowing through windows, realistic shadows, soft ambient sky light.');
  lines.push('- High-end but authentic rural farmhouse restoration — NOT a resort, NOT a hotel.');
  lines.push('');

  lines.push('STRICT RULES:');
  lines.push('- DO NOT change the building shape, add floors, add towers, or alter the silhouette.');
  lines.push('- DO NOT change the surrounding hills, distant trees, fields, or sky composition.');
  lines.push('- No people, no text, no watermark, no logos.');
  lines.push('- Photorealistic quality, consistent lighting, natural materials only.');

  if (additionalInstructions) {
    lines.push('');
    lines.push(`ADDITIONAL: ${additionalInstructions}`);
  }

  return lines.join('\n');
}

function buildInteriorPrompt(
  scenario: RenovationScenario,
  renderingType: RenderingType,
  additionalInstructions?: string,
): string {
  const view = VIEW_CONTEXT[renderingType];
  const details = getRenovationDetails(scenario);
  const isLifestyle = scenario.type === 'lifestyle' || scenario.type === 'high_end';
  const isGuest = renderingType === 'interior_airbnb';
  const isKitchen = renderingType === 'interior_kitchen';

  const lines: string[] = [];

  lines.push(
    `Transform this ${view.label} photo into a photorealistic renovation rendering of a restored Italian farmhouse interior.`,
  );
  lines.push(
    'Preserve the exact room shape, ceiling height, window positions, and structural elements, but show the space fully renovated with modern comfort and traditional character.',
  );
  lines.push('');

  lines.push('STRUCTURAL ELEMENTS:');
  lines.push('- Exposed original stone or brick walls where structurally present, cleaned and sealed.');
  lines.push('- Restored wooden ceiling beams (travi), cleaned and treated, warm natural wood tone.');
  lines.push('- Terracotta or reclaimed cotto floor tiles, warm and aged.');
  lines.push('');

  lines.push('FINISHES:');
  if (details.interiors.length > 0) {
    lines.push(`- Specific work: ${details.interiors.join('; ')}.`);
  }
  if (isKitchen) {
    lines.push('- Solid wood or painted kitchen cabinetry in muted tones, stone countertops, open shelving with ceramics.');
    lines.push('- Modern appliances integrated discreetly, large farmhouse sink, copper or iron fixtures.');
  } else if (isGuest) {
    lines.push('- Comfortable bed with quality linen in natural white/cream, bedside reading lamps.');
    lines.push('- Simple elegant furnishings: wooden wardrobe, writing desk, upholstered chair.');
    if (isLifestyle) {
      lines.push('- Boutique hotel quality but with farmhouse warmth — curated, not decorated.');
    }
  } else {
    lines.push('- Comfortable seating: linen-upholstered sofas and armchairs in warm neutral tones.');
    lines.push('- Wooden bookshelves, a fireplace if structurally present, soft area rugs on cotto floors.');
  }
  lines.push('- Plastered walls in warm white (calce) where not exposed stone.');
  lines.push('- Iron or aged brass light fixtures, warm white bulbs.');
  lines.push('');

  if (details.systems.length > 0) {
    lines.push('MODERN SYSTEMS (invisible but implied):');
    lines.push(`- ${details.systems.join('; ')}.`);
    lines.push('- No visible radiators, ducts, or conduits — all concealed.');
    lines.push('');
  }

  lines.push('ATMOSPHERE:');
  lines.push('- Warm golden-hour light streaming through windows, soft shadows.');
  lines.push('- A few personal touches: books, a wine bottle, ceramics, dried flowers — lived-in, not staged.');
  lines.push('- Authentic Italian farmhouse character with modern comfort — NOT minimalist, NOT hotel.');
  lines.push('');

  lines.push('STRICT RULES:');
  lines.push('- DO NOT change the room shape, ceiling structure, or window positions.');
  lines.push('- DO NOT add rooms, walls, or structural elements not present in the original.');
  lines.push('- No people, no text, no watermark, no logos.');
  lines.push('- Photorealistic quality, consistent lighting, natural materials only.');

  if (additionalInstructions) {
    lines.push('');
    lines.push(`ADDITIONAL: ${additionalInstructions}`);
  }

  return lines.join('\n');
}

export function buildEditPrompt(
  scenario: RenovationScenario,
  renderingType: RenderingType,
  additionalInstructions?: string,
): string {
  if (isInterior(renderingType)) {
    return buildInteriorPrompt(scenario, renderingType, additionalInstructions);
  }
  return buildExteriorPrompt(scenario, renderingType, additionalInstructions);
}

export function buildRenderingPrompt(
  scenario: RenovationScenario,
  renderingType: RenderingType,
  additionalInstructions?: string,
): string {
  return buildEditPrompt(scenario, renderingType, additionalInstructions);
}
