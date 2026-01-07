/**
 * XML to JSON conversion utilities for BoardGameGeek API responses
 * BGG XMLAPI2 returns XML that needs to be parsed and converted to JSON
 */

/**
 * Parse XML string and convert to JSON object
 * Uses browser's native DOMParser for XML parsing
 */
export function parseXmlToJson(xmlString: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parsing errors
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error(`XML parsing error: ${parseError[0].textContent}`);
  }

  return xmlElementToJson(xmlDoc.documentElement);
}

/**
 * Convert an XML element to a JavaScript object
 */
function xmlElementToJson(element: Element): any {
  const obj: any = {};

  // Add attributes
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    obj[attr.name] = parseValue(attr.value);
  }

  // Process child elements
  const children = element.children;
  if (children.length === 0) {
    // Leaf node - add text content if it exists
    const text = element.textContent?.trim();
    if (text && Object.keys(obj).length === 0) {
      return parseValue(text);
    }
    if (text) {
      obj._text = parseValue(text);
    }
  } else {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childName = child.tagName;
      const childValue = xmlElementToJson(child);

      if (obj[childName] !== undefined) {
        // Multiple elements with same name - convert to array
        if (!Array.isArray(obj[childName])) {
          obj[childName] = [obj[childName]];
        }
        obj[childName].push(childValue);
      } else {
        obj[childName] = childValue;
      }
    }
  }

  return obj;
}

/**
 * Parse string value to appropriate type
 */
function parseValue(value: string): string | number {
  // Try to parse as number
  if (/^-?\d+\.?\d*$/.test(value)) {
    return parseFloat(value);
  }
  return value;
}

/**
 * Parse BGG user info XML response
 * Endpoint: https://boardgamegeek.com/xmlapi2/user?name={username}
 */
export function parseUserInfo(xmlString: string): {
  id: string;
  name: string;
  yearregistered?: number;
  lastmodified?: string;
} | null {
  try {
    const json = parseXmlToJson(xmlString);

    // Check if user exists
    if (!json || json["@attributes"]?.type === "error" || json.error) {
      return null;
    }

    return {
      id: json.id?._text || json.id || json["@attributes"]?.id,
      name: json.name?._text || json.name || json["@attributes"]?.name,
      yearregistered: json.yearregistered?._text || json.yearregistered,
      lastmodified: json.lastmodified?._text || json.lastmodified,
    };
  } catch (error) {
    console.error("Error parsing user info:", error);
    return null;
  }
}

/**
 * Parse BGG collection XML response
 * Endpoint: https://boardgamegeek.com/xmlapi2/collection?username={username}&own=1&stats=1
 */
export function parseCollection(xmlString: string): any[] {
  try {
    const json = parseXmlToJson(xmlString);

    // BGG returns <items> containing <item> elements
    // The root element after parsing is "items", and it has "item" as a direct child
    const items = json.item || json.items?.item;

    if (!items) {
      console.log("No items found in parsed JSON:", json);
      return [];
    }

    // Ensure we have an array
    const itemsArray = Array.isArray(items) ? items : [items];

    return itemsArray.map((item: any) => ({
      // Core item attributes (directly on item in BGG XMLAPI2)
      objectid: item.objectid,
      objecttype: item.objecttype,
      subtype: item.subtype,
      collid: item.collid,

      // Basic info
      name: item.name?._text || item.name,
      yearpublished: item.yearpublished,

      // Images
      image: item.image,
      thumbnail: item.thumbnail,

      // Stats (directly on stats object, not in @attributes)
      stats: item.stats && {
        minplayers: item.stats.minplayers,
        maxplayers: item.stats.maxplayers,
        minplaytime: item.stats.minplaytime,
        maxplaytime: item.stats.maxplaytime,
        playingtime: item.stats.playingtime,
        numowned: item.stats.numowned,

        // Rating information (nested values are under "value" attribute)
        rating: item.stats.rating && {
          value: item.stats.rating.value,
          usersrated: item.stats.rating.usersrated?.value,
          average: item.stats.rating.average?.value,
          bayesaverage: item.stats.rating.bayesaverage?.value,
          stddev: item.stats.rating.stddev?.value,
          median: item.stats.rating.median?.value,

          // Ranks (can be single object or array)
          ranks: item.stats.rating.ranks?.rank
        }
      },

      // Status (directly on status object)
      status: item.status && {
        own: item.status.own,
        prevowned: item.status.prevowned,
        fortrade: item.status.fortrade,
        want: item.status.want,
        wanttoplay: item.status.wanttoplay,
        wanttobuy: item.status.wanttobuy,
        wishlist: item.status.wishlist,
        preordered: item.status.preordered,
        lastmodified: item.status.lastmodified,
      },

      // Number of plays
      numplays: item.numplays || 0,
    }));
  } catch (error) {
    console.error("Error parsing collection:", error);
    return [];
  }
}

/**
 * Parse BGG game details XML response
 * Endpoint: https://boardgamegeek.com/xmlapi2/thing?id={gameId}&stats=1
 */
export function parseGameInfo(xmlString: string): any | null {
  try {
    const json = parseXmlToJson(xmlString);

    // BGG returns <items> containing <item> elements
    const items = json.items?.item;

    if (!items) {
      return null;
    }

    // Handle single item or array
    const item = Array.isArray(items) ? items[0] : items;

    // Parse name (get primary name if multiple names exist)
    let name = "";
    if (Array.isArray(item.name)) {
      const primary = item.name.find((n: any) => n["@attributes"]?.type === "primary");
      name = primary?.["@attributes"]?.value || item.name[0]?.["@attributes"]?.value || "";
    } else {
      name = item.name?.["@attributes"]?.value || "";
    }

    return {
      objectid: item["@attributes"]?.id,
      objecttype: item["@attributes"]?.type,

      // Basic info
      name,
      sortindex: item.name?.["@attributes"]?.sortindex,
      description: item.description?._text || item.description,

      // Year and images
      yearpublished: item.yearpublished?._text || item.yearpublished?.["@attributes"]?.value,
      image: item.image?._text || item.image,
      thumbnail: item.thumbnail?._text || item.thumbnail,

      // Players and playtime
      minplayers: item.minplayers?._text || item.minplayers?.["@attributes"]?.value,
      maxplayers: item.maxplayers?._text || item.maxplayers?.["@attributes"]?.value,
      playtime: item.playtime?._text || item.playtime?.["@attributes"]?.value,
      minplaytime: item.minplaytime?._text || item.minplaytime?.["@attributes"]?.value,
      maxplaytime: item.maxplaytime?._text || item.maxplaytime?.["@attributes"]?.value,

      // Age and language
      minage: item.minage?._text || item.minage?.["@attributes"]?.value,

      // Categories, mechanics, etc.
      links: item.link && (
        Array.isArray(item.link)
          ? item.link.map((l: any) => ({
              type: l["@attributes"]?.type,
              id: l["@attributes"]?.id,
              value: l["@attributes"]?.value,
            }))
          : [{
              type: item.link?.["@attributes"]?.type,
              id: item.link?.["@attributes"]?.id,
              value: item.link?.["@attributes"]?.value,
            }]
      ),

      // Polls (player count poll, language dependence, etc.)
      polls: item.poll && (
        Array.isArray(item.poll)
          ? item.poll.map((p: any) => ({
              name: p["@attributes"]?.name,
              title: p["@attributes"]?.title,
              totalvotes: p["@attributes"]?.totalvotes,
            }))
          : [{
              name: item.poll?.["@attributes"]?.name,
              title: item.poll?.["@attributes"]?.title,
              totalvotes: item.poll?.["@attributes"]?.totalvotes,
            }]
      ),

      // Stats
      statistics: item.statistics && {
        ratings: item.statistics.ratings && {
          usersrated: item.statistics.ratings.usersrated?._text || item.statistics.ratings.usersrated?.["@attributes"]?.value,
          average: item.statistics.ratings.average?._text || item.statistics.ratings.average?.["@attributes"]?.value,
          bayesaverage: item.statistics.ratings.bayesaverage?._text || item.statistics.ratings.bayesaverage?.["@attributes"]?.value,
          stddev: item.statistics.ratings.stddev?._text || item.statistics.ratings.stddev?.["@attributes"]?.value,
          median: item.statistics.ratings.median?._text || item.statistics.ratings.median?.["@attributes"]?.value,

          // Ranks
          ranks: item.statistics.ratings.ranks?.rank,

          // Weight
          averageweight: item.statistics.ratings.averageweight?._text || item.statistics.ratings.averageweight?.["@attributes"]?.value,
        }
      }
    };
  } catch (error) {
    console.error("Error parsing game info:", error);
    return null;
  }
}

/**
 * Check if BGG API is still processing the request
 * BGG returns HTTP 202 with a message when the request is being processed
 */
export function isBggProcessing(xmlString: string): boolean {
  try {
    const json = parseXmlToJson(xmlString);
    return json?.html?.body?.p?.includes("processed") || false;
  } catch {
    return false;
  }
}
