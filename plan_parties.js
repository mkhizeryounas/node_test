'use strict';

const kmeans = require('node-kmeans');
const fs = require('fs');
let members = require('./members.json');

let interests_list = {};

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

const generateHashKey = data => {
  let hash_key = '';
  data.map(e => {
    hash_key += `${e}:`;
  });
  return hash_key;
};

const mostOccured = arr => {
  var a = [],
    b = [],
    prev;

  arr.sort();
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== prev) {
      a.push(arr[i]);
      b.push(1);
    } else {
      b[b.length - 1]++;
    }
    prev = arr[i];
  }

  return [a, b];
};

const generateCluster = async member_hash_table_tmp => {
  let k = Math.floor(Object.entries(member_hash_table_tmp).length / 6);
  let vectors = Object.entries(member_hash_table_tmp).map(
    ([key, value]) => value.training_data
  );
  let clusters = await new Promise((resolve, reject) => {
    kmeans.clusterize(vectors, { k }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
  let parties = [];
  clusters.map(e => {
    if (e.cluster.length >= 6) {
      let party_members = [];
      for (let i = 0; i < 6; i++) {
        party_members.push(e.cluster[i]);
      }
      parties.push(party_members);
    }
  });
  return parties;
};
let PARTIES = [];
const planParties = async (member_hash_table_tmp, parties = []) => {
  let parties_clusters = await generateCluster(member_hash_table_tmp);
  parties_clusters.map(e => {
    e.map(e2 => {
      delete member_hash_table_tmp[generateHashKey(e2)];
    });
  });
  PARTIES = [...PARTIES, ...parties_clusters];
  if (Object.keys(member_hash_table_tmp).length > 6) {
    let p = await planParties(member_hash_table_tmp);
    return p;
  } else {
    // Add the remaining randomly to fill 6-8 member requirement
    Object.entries(member_hash_table_tmp).map(([key, value], index) => {
      PARTIES[index].push(value.training_data);
    });
    return PARTIES;
  }
};

exports.plan_parties = async function() {
  // Getting list of all interests
  members = members.map(e => {
    e['interests_hash'] = {};
    e.interests.map(e2 => {
      e.interests_hash[e2.topic] = e2.interest;
      if (!interests_list.hasOwnProperty(e2.topic)) {
        interests_list[e2.topic] = 1;
      }
    });
    return e;
  });
  interests_list = Object.entries(interests_list).map(([key, value]) => {
    return key;
  });
  members.map(e => {
    interests_list.map(e2 => {
      if (!e.interests_hash.hasOwnProperty(e2)) {
        e.interests_hash[e2] = -2;
      }
    });
  });
  let personality = {
    'Very Introverted': 1,
    Introverted: 2,
    Average: 3,
    Extroverted: 4,
    'Very Extroverted': 5
  };
  let member_hash_table = {};
  members.map((e, key) => {
    let data = [
      e.level,
      // e.department,
      e.numEmployees,
      // e.title,
      e.gender === 'M' ? 1 : 2,
      personality[e.personality]
    ];
    interests_list.map(e2 => {
      data.push(e.interests_hash[e2]);
    });
    let hash_key = generateHashKey(data);
    member_hash_table[hash_key] = { member: e, training_data: data };
    return data;
  });
  let member_hash_table_tmp = { ...member_hash_table };
  let planedParties = await planParties(member_hash_table_tmp);
  // console.log('planedParties', planedParties);
  const partyFileName = 'suggested_dinners.md';
  // Empty file
  fs.writeFileSync(partyFileName, '');
  let plannedUnique = {};
  planedParties.map(e => {
    let partyString = '';
    let titleArr = [];
    e.map(e2 => {
      let singleMember = member_hash_table[generateHashKey(e2)].member;
      let interstedIn1 = '',
        ct1 = -3;
      let interstedIn2 = '',
        ct2 = -3;
      singleMember.interests.map(e3 => {
        if (e3.interest > ct1) {
          ct1 = e3.interest;
          interstedIn1 = e3.topic;
        } else if (e3.interest > ct2) {
          ct2 = e3.interest;
          interstedIn2 = e3.topic;
        }
      });
      titleArr.push(...[singleMember.title, interstedIn1, interstedIn2]);

      partyString += `- ${singleMember.name}, ${singleMember.title} @ ${
        singleMember.company
      }. Intersted in ${interstedIn1}${
        interstedIn2 ? ` and ${interstedIn2}` : ''
      }.\n`;
    });
    let partyName = mostOccured(titleArr);
    let tmpName = '',
      tmpCount = -1,
      partyIndex = -1;
    partyName[1].map((e, index) => {
      if (
        e > tmpCount &&
        partyName[0][index] != '' &&
        !plannedUnique.hasOwnProperty(partyName[0][index])
      ) {
        tmpCount = e;
        tmpName = partyName[0][index].capitalize();
        partyIndex = index;
      }
    });
    plannedUnique[partyName[0][partyIndex]] = 1;

    if (tmpName === '' || tmpCount < 0) {
      console.log('partyName', partyName);
    }
    fs.appendFileSync(partyFileName, `# ${tmpName.capitalize()} \n\n`);
    fs.appendFileSync(partyFileName, `${partyString}\n\n`);
  });
  console.log('Done!');
};

// These lines allow your function to be called from the command line.
if (require.main === module) {
  exports.plan_parties();
}
