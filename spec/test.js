const puppeteer = require("puppeteer");
const path = require('path');
const faker = require('faker');

const randomize = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const roomType = ['ENTIRE APARTMENT', 'ENTIRE LOFT', 'PRIVATE ROOM IN TOWNHOUSE', 'PRIVATE ROOM IN APARTMENT', 'PRIVATE ROOM', 'PRIVATE ROOM IN GUEST SUITE'];

const adj = ['Small', 'Large', 'Cozy', 'Amazing', 'Little', 'Beautiful', 'Charming', 'Lovely', ''];
const noun = ['Apartment', 'Loft', 'House', 'Condo', 'Studio'];
const area = ['in Downtown', 'Just Outside', 'Outside', 'in', 'Steps Away from Downtown', 'Minutes Away from'];

const createListing = (location) => {
  return `${randomize(adj)} ${randomize(noun)} ${randomize(area)} ${location}`;
};

const paragraphs = () => {
  return faker.lorem.paragraph() + ' ' + faker.lorem.paragraph();
};

const createData = (location) => {
  return {
    room_type: randomize(roomType),
    username: faker.name.findName(),
    room_details: createListing(location),
    city: location,
    city_details: paragraphs(),
    listing_details: paragraphs(),
    guest_access: paragraphs(),
    interaction: paragraphs(),
    other: paragraphs(),
    avatar: paragraphs(),
    num_guests: randomize([1, 2, 3, 4, 5, 6, 7, 8]),
    num_bedrooms: randomize([1, 2, 3]),
    num_beds: randomize([1, 2, 3, 4, 5, 6]),
    num_baths: randomize([1, 2])
  };
}

const loops = 1000;
let postgres;
let mongo;

describe('Test MongoDB', () => {
  beforeAll(() => {
    mongo = require('../server/model/mongoModel.js');
  });

  afterAll(() => {
    mongo.connection.close();
  });

  test('read / write speeds', async (done) => {
    let totalWriteTime = 0;
    let totalReadTime = 0;
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000)
    });
    for (var x = 0; x < loops; x++) {
      let location = faker.address.city();
      let timeWrite1 = new Date().getTime();
      await mongo.addListing(createData(location));
      let timeWrite2 = new Date().getTime();
      totalWriteTime += (timeWrite2 - timeWrite1) / 1000;
      // console.log('Time to write data:', (timeWrite2 - timeWrite1) / 1000)
      let timeRead1 = new Date().getTime();
      let response;
      await mongo.getListing(10000001 + x).then((results) => {
        response = results;
      });
      let timeRead2 = new Date().getTime();
      totalReadTime += (timeRead2 - timeRead1) / 1000;
      // console.log('Time to read data:', (timeRead2 - timeRead1) / 1000)
      expect(response.city).toEqual(location);
      await mongo.deleteListing(10000001 + x);
    }
    await mongo.resetCounter(10000000);
    let response;
    await mongo.getListing(10000000).then((results) => {
      response = results;
    });
    expect(response.city).toEqual('Port Amanistad');
    console.log('Average Write Speed Mongo:', totalWriteTime / loops);
    console.log('Average Read Speed Mongo:', totalReadTime / loops);
    done();
  }, 100000);

  test('read speeds', async (done) => {
    let totalReadTime = 0;
    for (var x = 0; x < loops; x++) {
      let id = Math.ceil(Math.random() * 1000000) + 9000000;
      // let id = Math.ceil(Math.random() * 10000000);
      // let id = 10000000;
      // let id = 1;
      let timeRead1 = new Date().getTime();
      let response;
      await mongo.getListing(id).then((results) => {
        response = results;
      });
      let timeRead2 = new Date().getTime();
      totalReadTime += (timeRead2 - timeRead1) / 1000;
      // console.log('Time to read data:', (timeRead2 - timeRead1) / 1000)
      expect(response.id).toEqual(id);
    }
    console.log('Average Read Speed Mongo:', totalReadTime / loops);
    done();
  }, 100000);
});

describe('Test Postgres', () => {
  beforeAll(() => {
    postgres = require('../server/model/postgresModel.js');
  });

  afterAll(() => {
    postgres.connection.destroy();
  });

  test('read / write speeds', async (done) => {
    let totalWriteTime = 0;
    let totalReadTime = 0;
    for (var x = 0; x < loops; x++) {
      let location = faker.address.city();
      let timeWrite1 = new Date().getTime();
      await postgres.addListing(createData(location));
      let timeWrite2 = new Date().getTime();
      totalWriteTime += (timeWrite2 - timeWrite1) / 1000;
      // console.log('Time to write data:', (timeWrite2 - timeWrite1) / 1000)
      let timeRead1 = new Date().getTime();
      let response;
      await postgres.getListing(10000001 + x).then((results) => {
        response = results;
      });
      let timeRead2 = new Date().getTime();
      totalReadTime += (timeRead2 - timeRead1) / 1000;
      // console.log('Time to read data:', (timeRead2 - timeRead1) / 1000)
      expect(response.city).toEqual(location);
      await postgres.deleteListing(10000001 + x);
    }
    await postgres.resetCounter(10000001);
    let response;
    await postgres.getListing(10000000).then((results) => {
      response = results;
    });
    expect(response.city).toEqual('Port Amanistad');
    console.log('Average Write Speed Postgres:', totalWriteTime / loops);
    console.log('Average Read Speed Postgres:', totalReadTime / loops);
    done();
  }, 100000);

  test('read speeds', async (done) => {
    let totalReadTime = 0;
    for (var x = 0; x < loops; x++) {
      let id = Math.ceil(Math.random() * 1000000) + 9000000;
      // let id = Math.ceil(Math.random() * 10000000);
      // let id = 10000000;
      // let id = 1;
      let timeRead1 = new Date().getTime();
      let response;
      await postgres.getListing(id).then((results) => {
        response = results;
      });
      let timeRead2 = new Date().getTime();
      totalReadTime += (timeRead2 - timeRead1) / 1000;
      // console.log('Time to read data:', (timeRead2 - timeRead1) / 1000)
      expect(response.id).toEqual(id);
    }
    console.log('Average Random Read Speed Postgres:', totalReadTime / loops);
    expect(totalReadTime / loops).toBeLessThan(0.050);
    done();
  }, 1000000);
});
