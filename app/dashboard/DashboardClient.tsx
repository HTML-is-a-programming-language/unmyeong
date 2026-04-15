'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ReadingMode, ReadingCategory, Celebrity } from '@/types'
import styles from './dashboard.module.css'
import BuyCreditsModal from '@/components/BuyCreditsModal'
import ShareCard from '@/components/ShareCard'
import { t, tCredits } from '@/lib/i18n'

// ── 상수 데이터 ──────────────────────────────────────────────────

const READING_CATEGORY_IDS = [
  'personality', 'career', 'wealth', 'love', 'marriage',
  'health', 'family', 'children', 'mentor', 'destiny'
] as const

const LANGUAGES = [
  { code: 'Korean',     flag: '🇰🇷', label: '한국어' },
  { code: 'English',    flag: '🇺🇸', label: 'English' },
  { code: 'Japanese',   flag: '🇯🇵', label: '日本語' },
  { code: 'Thai',       flag: '🇹🇭', label: 'ภาษาไทย' },
  { code: 'Spanish',    flag: '🇪🇸', label: 'Español' },
  { code: 'Portuguese', flag: '🇧🇷', label: 'Português' },
  { code: 'Chinese',    flag: '🇨🇳', label: '中文' },
]

const GROUPS: Record<string, Celebrity[]> = {
  // ── HYBE ─────────────────────────────────────────────────────────
  'BTS': [
    { id:1,  name:'RM',        group:'BTS', birth:'1994-09-12', gender:'male', sign:'♍ Virgo' },
    { id:2,  name:'Jin',       group:'BTS', birth:'1992-12-04', gender:'male', sign:'♐ Sagittarius' },
    { id:3,  name:'Suga',      group:'BTS', birth:'1993-03-09', gender:'male', sign:'♓ Pisces' },
    { id:4,  name:'J-Hope',    group:'BTS', birth:'1994-02-18', gender:'male', sign:'♒ Aquarius' },
    { id:5,  name:'Jimin',     group:'BTS', birth:'1995-10-13', gender:'male', sign:'♎ Libra' },
    { id:6,  name:'V',         group:'BTS', birth:'1995-12-30', gender:'male', sign:'♑ Capricorn' },
    { id:7,  name:'Jungkook',  group:'BTS', birth:'1997-09-01', gender:'male', sign:'♍ Virgo' },
  ],
  'TXT': [
    { id:133, name:'Yeonjun',    group:'TXT', birth:'1999-09-13', gender:'male', sign:'♍ Virgo' },
    { id:134, name:'Soobin',     group:'TXT', birth:'2000-12-05', gender:'male', sign:'♐ Sagittarius' },
    { id:135, name:'Beomgyu',    group:'TXT', birth:'2001-03-13', gender:'male', sign:'♓ Pisces' },
    { id:136, name:'Taehyun',    group:'TXT', birth:'2002-02-05', gender:'male', sign:'♒ Aquarius' },
    { id:137, name:'Huening Kai',group:'TXT', birth:'2002-08-14', gender:'male', sign:'♌ Leo' },
  ],
  'ENHYPEN': [
    { id:118, name:'Jungwon',  group:'ENHYPEN', birth:'2004-02-09', gender:'male', sign:'♒ Aquarius' },
    { id:119, name:'Heeseung', group:'ENHYPEN', birth:'2001-10-15', gender:'male', sign:'♎ Libra' },
    { id:120, name:'Jay',      group:'ENHYPEN', birth:'2002-04-20', gender:'male', sign:'♈ Aries' },
    { id:121, name:'Jake',     group:'ENHYPEN', birth:'2002-11-15', gender:'male', sign:'♏ Scorpio' },
    { id:122, name:'Sunghoon', group:'ENHYPEN', birth:'2002-12-08', gender:'male', sign:'♐ Sagittarius' },
    { id:123, name:'Sunoo',    group:'ENHYPEN', birth:'2003-06-24', gender:'male', sign:'♋ Cancer' },
    { id:124, name:'Ni-ki',    group:'ENHYPEN', birth:'2005-12-09', gender:'male', sign:'♐ Sagittarius' },
  ],
  'ILLIT': [
    { id:85, name:'Yunah',  group:'ILLIT', birth:'2004-01-15', gender:'female', sign:'♑ Capricorn' },
    { id:86, name:'Minju',  group:'ILLIT', birth:'2004-11-30', gender:'female', sign:'♐ Sagittarius' },
    { id:87, name:'Moka',   group:'ILLIT', birth:'2003-12-10', gender:'female', sign:'♐ Sagittarius' },
    { id:88, name:'Wonhee', group:'ILLIT', birth:'2006-03-21', gender:'female', sign:'♈ Aries' },
    { id:89, name:'Iroha',  group:'ILLIT', birth:'2005-12-07', gender:'female', sign:'♐ Sagittarius' },
  ],
  'LE SSERAFIM': [
    { id:97,  name:'Chaewon', group:'LE SSERAFIM', birth:'2000-08-01', gender:'female', sign:'♌ Leo' },
    { id:98,  name:'Sakura',  group:'LE SSERAFIM', birth:'1998-03-19', gender:'female', sign:'♓ Pisces' },
    { id:99,  name:'Yunjin',  group:'LE SSERAFIM', birth:'2001-10-08', gender:'female', sign:'♎ Libra' },
    { id:110, name:'Kazuha',  group:'LE SSERAFIM', birth:'2003-08-09', gender:'female', sign:'♌ Leo' },
    { id:111, name:'Eunchae', group:'LE SSERAFIM', birth:'2006-11-10', gender:'female', sign:'♏ Scorpio' },
  ],
  'SEVENTEEN': [
    { id:30,  name:'S.Coups',   group:'SEVENTEEN', birth:'1995-08-08', gender:'male', sign:'♌ Leo' },
    { id:31,  name:'Jeonghan',  group:'SEVENTEEN', birth:'1995-10-04', gender:'male', sign:'♎ Libra' },
    { id:32,  name:'Joshua',    group:'SEVENTEEN', birth:'1995-12-30', gender:'male', sign:'♑ Capricorn' },
    { id:500, name:'Jun',       group:'SEVENTEEN', birth:'1996-06-10', gender:'male', sign:'♊ Gemini' },
    { id:501, name:'Hoshi',     group:'SEVENTEEN', birth:'1996-06-15', gender:'male', sign:'♊ Gemini' },
    { id:33,  name:'Wonwoo',    group:'SEVENTEEN', birth:'1996-07-17', gender:'male', sign:'♋ Cancer' },
    { id:34,  name:'Woozi',     group:'SEVENTEEN', birth:'1996-11-22', gender:'male', sign:'♐ Sagittarius' },
    { id:502, name:'DK',        group:'SEVENTEEN', birth:'1997-02-18', gender:'male', sign:'♒ Aquarius' },
    { id:35,  name:'Mingyu',    group:'SEVENTEEN', birth:'1997-04-06', gender:'male', sign:'♈ Aries' },
    { id:503, name:'The8',      group:'SEVENTEEN', birth:'1997-11-07', gender:'male', sign:'♏ Scorpio' },
    { id:504, name:'Seungkwan', group:'SEVENTEEN', birth:'1998-01-16', gender:'male', sign:'♑ Capricorn' },
    { id:36,  name:'Vernon',    group:'SEVENTEEN', birth:'1998-02-18', gender:'male', sign:'♒ Aquarius' },
    { id:37,  name:'Dino',      group:'SEVENTEEN', birth:'1999-02-11', gender:'male', sign:'♒ Aquarius' },
  ],
  'TWS': [
    { id:505, name:'Shinyu',   group:'TWS', birth:'2004-02-09', gender:'male', sign:'♒ Aquarius' },
    { id:506, name:'Junhyeon', group:'TWS', birth:'2004-06-03', gender:'male', sign:'♊ Gemini' },
    { id:507, name:'Kyungmin', group:'TWS', birth:'2005-01-10', gender:'male', sign:'♑ Capricorn' },
    { id:508, name:'Jihoon',   group:'TWS', birth:'2005-06-07', gender:'male', sign:'♊ Gemini' },
    { id:509, name:'Dohoon',   group:'TWS', birth:'2006-04-07', gender:'male', sign:'♈ Aries' },
    { id:510, name:'Youngjae', group:'TWS', birth:'2006-09-17', gender:'male', sign:'♍ Virgo' },
  ],
  'BOYNEXTDOOR': [
    { id:390, name:'Sungho',  group:'BOYNEXTDOOR', birth:'2002-07-27', gender:'male', sign:'♌ Leo' },
    { id:391, name:'Leehan',  group:'BOYNEXTDOOR', birth:'2005-09-27', gender:'male', sign:'♎ Libra' },
    { id:392, name:'Riwoo',   group:'BOYNEXTDOOR', birth:'2003-09-07', gender:'male', sign:'♍ Virgo' },
    { id:393, name:'Taesan',  group:'BOYNEXTDOOR', birth:'2003-07-01', gender:'male', sign:'♋ Cancer' },
    { id:394, name:'Jaehyun', group:'BOYNEXTDOOR', birth:'2004-05-06', gender:'male', sign:'♉ Taurus' },
    { id:395, name:'Woonhak', group:'BOYNEXTDOOR', birth:'2005-07-17', gender:'male', sign:'♋ Cancer' },
  ],
  'NewJeans': [
    { id:330, name:'Minji',    group:'NewJeans', birth:'2004-05-07', gender:'female', sign:'♉ Taurus' },
    { id:331, name:'Hanni',    group:'NewJeans', birth:'2004-10-06', gender:'female', sign:'♎ Libra' },
    { id:332, name:'Danielle', group:'NewJeans', birth:'2005-04-11', gender:'female', sign:'♈ Aries' },
    { id:333, name:'Haerin',   group:'NewJeans', birth:'2006-05-15', gender:'female', sign:'♉ Taurus' },
    { id:334, name:'Hyein',    group:'NewJeans', birth:'2008-04-21', gender:'female', sign:'♈ Aries' },
  ],

  // ── JYP ──────────────────────────────────────────────────────────
  '2PM': [
    { id:511, name:'Jun.K',    group:'2PM', birth:'1988-01-15', gender:'male', sign:'♑ Capricorn' },
    { id:512, name:'Nichkhun', group:'2PM', birth:'1988-06-24', gender:'male', sign:'♋ Cancer' },
    { id:513, name:'Taecyeon', group:'2PM', birth:'1988-12-27', gender:'male', sign:'♑ Capricorn' },
    { id:514, name:'Wooyoung', group:'2PM', birth:'1989-04-30', gender:'male', sign:'♉ Taurus' },
    { id:515, name:'Junho',    group:'2PM', birth:'1990-01-25', gender:'male', sign:'♒ Aquarius' },
    { id:516, name:'Chansung', group:'2PM', birth:'1990-08-11', gender:'male', sign:'♌ Leo' },
  ],
  'DAY6': [
    { id:450, name:'Sungjin', group:'DAY6', birth:'1993-01-16', gender:'male', sign:'♑ Capricorn' },
    { id:451, name:'Young K', group:'DAY6', birth:'1993-12-19', gender:'male', sign:'♐ Sagittarius' },
    { id:452, name:'Wonpil',  group:'DAY6', birth:'1994-04-28', gender:'male', sign:'♉ Taurus' },
    { id:453, name:'Dowoon',  group:'DAY6', birth:'1995-08-25', gender:'male', sign:'♍ Virgo' },
  ],
  'TWICE': [
    { id:50,  name:'Nayeon',    group:'TWICE', birth:'1995-09-22', gender:'female', sign:'♍ Virgo' },
    { id:517, name:'Jeongyeon', group:'TWICE', birth:'1996-09-01', gender:'female', sign:'♍ Virgo' },
    { id:51,  name:'Momo',      group:'TWICE', birth:'1996-11-09', gender:'female', sign:'♏ Scorpio' },
    { id:52,  name:'Sana',      group:'TWICE', birth:'1996-12-29', gender:'female', sign:'♑ Capricorn' },
    { id:53,  name:'Jihyo',     group:'TWICE', birth:'1997-02-01', gender:'female', sign:'♒ Aquarius' },
    { id:518, name:'Mina',      group:'TWICE', birth:'1997-03-24', gender:'female', sign:'♈ Aries' },
    { id:519, name:'Dahyun',    group:'TWICE', birth:'1998-05-28', gender:'female', sign:'♊ Gemini' },
    { id:520, name:'Chaeyoung', group:'TWICE', birth:'1999-04-23', gender:'female', sign:'♉ Taurus' },
    { id:54,  name:'Tzuyu',     group:'TWICE', birth:'1999-06-14', gender:'female', sign:'♊ Gemini' },
  ],
  'Stray Kids': [
    { id:70,  name:'Bang Chan', group:'Stray Kids', birth:'1997-10-03', gender:'male', sign:'♎ Libra' },
    { id:71,  name:'Lee Know',  group:'Stray Kids', birth:'1998-10-25', gender:'male', sign:'♏ Scorpio' },
    { id:72,  name:'Changbin',  group:'Stray Kids', birth:'1999-08-11', gender:'male', sign:'♌ Leo' },
    { id:73,  name:'Hyunjin',   group:'Stray Kids', birth:'2000-03-20', gender:'male', sign:'♓ Pisces' },
    { id:521, name:'Han',       group:'Stray Kids', birth:'2000-09-14', gender:'male', sign:'♍ Virgo' },
    { id:74,  name:'Felix',     group:'Stray Kids', birth:'2000-09-15', gender:'male', sign:'♍ Virgo' },
    { id:522, name:'Seungmin',  group:'Stray Kids', birth:'2000-09-22', gender:'male', sign:'♍ Virgo' },
    { id:75,  name:'I.N',       group:'Stray Kids', birth:'2001-02-08', gender:'male', sign:'♒ Aquarius' },
  ],
  'ITZY': [
    { id:523, name:'Yeji',       group:'ITZY', birth:'1999-05-26', gender:'female', sign:'♊ Gemini' },
    { id:524, name:'Lia',        group:'ITZY', birth:'2000-07-21', gender:'female', sign:'♋ Cancer' },
    { id:525, name:'Ryujin',     group:'ITZY', birth:'2001-04-17', gender:'female', sign:'♈ Aries' },
    { id:526, name:'Chaeryeong', group:'ITZY', birth:'2001-06-05', gender:'female', sign:'♊ Gemini' },
    { id:527, name:'Yuna',       group:'ITZY', birth:'2003-12-09', gender:'female', sign:'♐ Sagittarius' },
  ],
  'Xdinary Heroes': [
    { id:528, name:'Jungsu',    group:'Xdinary Heroes', birth:'1997-07-21', gender:'male', sign:'♋ Cancer' },
    { id:529, name:'Gunil',     group:'Xdinary Heroes', birth:'1998-10-31', gender:'male', sign:'♏ Scorpio' },
    { id:530, name:'Gaon',      group:'Xdinary Heroes', birth:'2000-01-17', gender:'male', sign:'♑ Capricorn' },
    { id:531, name:'O.de',      group:'Xdinary Heroes', birth:'2000-09-20', gender:'male', sign:'♍ Virgo' },
    { id:532, name:'Jooyeon',   group:'Xdinary Heroes', birth:'2001-04-29', gender:'male', sign:'♉ Taurus' },
    { id:533, name:'Hyeongjun', group:'Xdinary Heroes', birth:'2003-08-09', gender:'male', sign:'♌ Leo' },
  ],
  'NMIXX': [
    { id:410, name:'Lily',     group:'NMIXX', birth:'2003-09-13', gender:'female', sign:'♍ Virgo' },
    { id:411, name:'Haewon',   group:'NMIXX', birth:'2003-01-27', gender:'female', sign:'♒ Aquarius' },
    { id:412, name:'Sullyoon', group:'NMIXX', birth:'2004-08-26', gender:'female', sign:'♍ Virgo' },
    { id:413, name:'Bae',      group:'NMIXX', birth:'2002-01-31', gender:'female', sign:'♒ Aquarius' },
    { id:414, name:'Jiwoo',    group:'NMIXX', birth:'2004-10-26', gender:'female', sign:'♏ Scorpio' },
    { id:415, name:'Kyujin',   group:'NMIXX', birth:'2005-01-01', gender:'female', sign:'♑ Capricorn' },
  ],
  'NEXZ': [
    { id:534, name:'Yujin',  group:'NEXZ', birth:'2004-01-17', gender:'male', sign:'♑ Capricorn' },
    { id:535, name:'Hibiki', group:'NEXZ', birth:'2003-07-15', gender:'male', sign:'♋ Cancer' },
    { id:536, name:'Yusei',  group:'NEXZ', birth:'2004-09-28', gender:'male', sign:'♎ Libra' },
    { id:537, name:'Taiki',  group:'NEXZ', birth:'2005-03-04', gender:'male', sign:'♓ Pisces' },
    { id:538, name:'Sho',    group:'NEXZ', birth:'2005-06-22', gender:'male', sign:'♊ Gemini' },
    { id:539, name:'Atom',   group:'NEXZ', birth:'2005-11-01', gender:'male', sign:'♏ Scorpio' },
    { id:540, name:'Ryo',    group:'NEXZ', birth:'2006-02-14', gender:'male', sign:'♒ Aquarius' },
  ],

  // ── YG ───────────────────────────────────────────────────────────
  'BLACKPINK': [
    { id:10, name:'Jisoo',  group:'BLACKPINK', birth:'1995-01-03', gender:'female', sign:'♑ Capricorn' },
    { id:11, name:'Jennie', group:'BLACKPINK', birth:'1996-01-16', gender:'female', sign:'♑ Capricorn' },
    { id:12, name:'Rosé',   group:'BLACKPINK', birth:'1997-02-11', gender:'female', sign:'♒ Aquarius' },
    { id:13, name:'Lisa',   group:'BLACKPINK', birth:'1997-03-27', gender:'female', sign:'♈ Aries' },
  ],
  'TREASURE': [
    { id:541, name:'Hyunsuk',  group:'TREASURE', birth:'2000-04-03', gender:'male', sign:'♈ Aries' },
    { id:542, name:'Jihoon',   group:'TREASURE', birth:'2001-01-26', gender:'male', sign:'♒ Aquarius' },
    { id:543, name:'Junkyu',   group:'TREASURE', birth:'2000-09-09', gender:'male', sign:'♍ Virgo' },
    { id:544, name:'Jaehyuk',  group:'TREASURE', birth:'2002-03-21', gender:'male', sign:'♈ Aries' },
    { id:545, name:'Asahi',    group:'TREASURE', birth:'2001-12-25', gender:'male', sign:'♑ Capricorn' },
    { id:546, name:'Yedam',    group:'TREASURE', birth:'2002-06-26', gender:'male', sign:'♋ Cancer' },
    { id:547, name:'Doyoung',  group:'TREASURE', birth:'2002-12-04', gender:'male', sign:'♐ Sagittarius' },
    { id:548, name:'Haruto',   group:'TREASURE', birth:'2003-04-05', gender:'male', sign:'♈ Aries' },
    { id:549, name:'Jeongwoo', group:'TREASURE', birth:'2004-01-01', gender:'male', sign:'♑ Capricorn' },
    { id:550, name:'Junghwan', group:'TREASURE', birth:'2004-09-28', gender:'male', sign:'♎ Libra' },
  ],
  'BABYMONSTER': [
    { id:90, name:'Ruka',     group:'BABYMONSTER', birth:'2002-03-20', gender:'female', sign:'♓ Pisces' },
    { id:91, name:'Pharita',  group:'BABYMONSTER', birth:'2004-07-19', gender:'female', sign:'♋ Cancer' },
    { id:92, name:'Asa',      group:'BABYMONSTER', birth:'2006-04-17', gender:'female', sign:'♈ Aries' },
    { id:93, name:'Ahyeon',   group:'BABYMONSTER', birth:'2007-04-11', gender:'female', sign:'♈ Aries' },
    { id:94, name:'Rami',     group:'BABYMONSTER', birth:'2007-07-10', gender:'female', sign:'♋ Cancer' },
    { id:95, name:'Rora',     group:'BABYMONSTER', birth:'2008-12-03', gender:'female', sign:'♐ Sagittarius' },
    { id:96, name:'Chiquita', group:'BABYMONSTER', birth:'2009-02-14', gender:'female', sign:'♒ Aquarius' },
  ],
  'WINNER': [
    { id:551, name:'Jinwoo',    group:'WINNER', birth:'1991-09-26', gender:'male', sign:'♎ Libra' },
    { id:552, name:'Seunghoon', group:'WINNER', birth:'1992-01-11', gender:'male', sign:'♑ Capricorn' },
    { id:553, name:'Mino',      group:'WINNER', birth:'1993-03-30', gender:'male', sign:'♈ Aries' },
    { id:554, name:'Seungyoon', group:'WINNER', birth:'1994-01-21', gender:'male', sign:'♒ Aquarius' },
  ],

  // ── SM ───────────────────────────────────────────────────────────
  'TVXQ!': [
    { id:555, name:'Yunho',    group:'TVXQ!', birth:'1986-02-06', gender:'male', sign:'♒ Aquarius' },
    { id:556, name:'Changmin', group:'TVXQ!', birth:'1988-02-18', gender:'male', sign:'♒ Aquarius' },
  ],
  'SUPER JUNIOR': [
    { id:557, name:'Leeteuk',  group:'SUPER JUNIOR', birth:'1983-07-01', gender:'male', sign:'♋ Cancer' },
    { id:558, name:'Heechul',  group:'SUPER JUNIOR', birth:'1983-07-10', gender:'male', sign:'♋ Cancer' },
    { id:559, name:'Yesung',   group:'SUPER JUNIOR', birth:'1984-08-24', gender:'male', sign:'♍ Virgo' },
    { id:560, name:'Shindong', group:'SUPER JUNIOR', birth:'1985-09-28', gender:'male', sign:'♎ Libra' },
    { id:561, name:'Sungmin',  group:'SUPER JUNIOR', birth:'1986-01-01', gender:'male', sign:'♑ Capricorn' },
    { id:562, name:'Eunhyuk',  group:'SUPER JUNIOR', birth:'1986-04-04', gender:'male', sign:'♈ Aries' },
    { id:563, name:'Siwon',    group:'SUPER JUNIOR', birth:'1986-04-07', gender:'male', sign:'♈ Aries' },
    { id:564, name:'Donghae',  group:'SUPER JUNIOR', birth:'1986-10-15', gender:'male', sign:'♎ Libra' },
    { id:565, name:'Ryeowook', group:'SUPER JUNIOR', birth:'1987-06-21', gender:'male', sign:'♊ Gemini' },
    { id:566, name:'Kyuhyun',  group:'SUPER JUNIOR', birth:'1988-02-03', gender:'male', sign:'♒ Aquarius' },
  ],
  "Girls' Generation": [
    { id:567, name:'Taeyeon',  group:"Girls' Generation", birth:'1989-03-09', gender:'female', sign:'♓ Pisces' },
    { id:568, name:'Sunny',    group:"Girls' Generation", birth:'1989-05-15', gender:'female', sign:'♉ Taurus' },
    { id:569, name:'Tiffany',  group:"Girls' Generation", birth:'1989-08-01', gender:'female', sign:'♌ Leo' },
    { id:570, name:'Hyoyeon',  group:"Girls' Generation", birth:'1989-09-22', gender:'female', sign:'♍ Virgo' },
    { id:571, name:'Yuri',     group:"Girls' Generation", birth:'1989-12-05', gender:'female', sign:'♐ Sagittarius' },
    { id:572, name:'Sooyoung', group:"Girls' Generation", birth:'1990-02-10', gender:'female', sign:'♒ Aquarius' },
    { id:573, name:'Yoona',    group:"Girls' Generation", birth:'1990-05-30', gender:'female', sign:'♊ Gemini' },
    { id:574, name:'Seohyun',  group:"Girls' Generation", birth:'1991-06-28', gender:'female', sign:'♋ Cancer' },
  ],
  'SHINee': [
    { id:300, name:'Onew',  group:'SHINee', birth:'1989-12-14', gender:'male', sign:'♐ Sagittarius' },
    { id:301, name:'Key',   group:'SHINee', birth:'1991-09-23', gender:'male', sign:'♎ Libra' },
    { id:302, name:'Minho', group:'SHINee', birth:'1991-12-09', gender:'male', sign:'♐ Sagittarius' },
    { id:303, name:'Taemin',group:'SHINee', birth:'1993-07-18', gender:'male', sign:'♋ Cancer' },
  ],
  'EXO': [
    { id:575, name:'Xiumin',   group:'EXO', birth:'1990-03-26', gender:'male', sign:'♈ Aries' },
    { id:60,  name:'Suho',     group:'EXO', birth:'1991-05-22', gender:'male', sign:'♊ Gemini' },
    { id:576, name:'Lay',      group:'EXO', birth:'1991-10-07', gender:'male', sign:'♎ Libra' },
    { id:61,  name:'Baekhyun', group:'EXO', birth:'1992-05-06', gender:'male', sign:'♉ Taurus' },
    { id:577, name:'Chen',     group:'EXO', birth:'1992-09-21', gender:'male', sign:'♍ Virgo' },
    { id:62,  name:'Chanyeol', group:'EXO', birth:'1992-11-27', gender:'male', sign:'♐ Sagittarius' },
    { id:63,  name:'D.O.',     group:'EXO', birth:'1993-01-12', gender:'male', sign:'♑ Capricorn' },
    { id:64,  name:'Kai',      group:'EXO', birth:'1994-01-14', gender:'male', sign:'♑ Capricorn' },
    { id:65,  name:'Sehun',    group:'EXO', birth:'1994-04-12', gender:'male', sign:'♈ Aries' },
  ],
  'Red Velvet': [
    { id:310, name:'Irene',  group:'Red Velvet', birth:'1991-03-29', gender:'female', sign:'♈ Aries' },
    { id:311, name:'Seulgi', group:'Red Velvet', birth:'1994-02-10', gender:'female', sign:'♒ Aquarius' },
    { id:312, name:'Wendy',  group:'Red Velvet', birth:'1994-02-21', gender:'female', sign:'♒ Aquarius' },
    { id:313, name:'Joy',    group:'Red Velvet', birth:'1996-09-03', gender:'female', sign:'♍ Virgo' },
    { id:314, name:'Yeri',   group:'Red Velvet', birth:'1999-03-05', gender:'female', sign:'♓ Pisces' },
  ],
  'NCT 127': [
    { id:351, name:'Johnny',  group:'NCT 127', birth:'1995-02-09', gender:'male', sign:'♒ Aquarius' },
    { id:352, name:'Taeyong', group:'NCT 127', birth:'1995-07-01', gender:'male', sign:'♋ Cancer' },
    { id:353, name:'Yuta',    group:'NCT 127', birth:'1995-10-26', gender:'male', sign:'♏ Scorpio' },
    { id:354, name:'Doyoung', group:'NCT 127', birth:'1996-02-01', gender:'male', sign:'♒ Aquarius' },
    { id:355, name:'Jaehyun', group:'NCT 127', birth:'1997-02-14', gender:'male', sign:'♒ Aquarius' },
    { id:578, name:'Jungwoo', group:'NCT 127', birth:'1998-02-19', gender:'male', sign:'♒ Aquarius' },
    { id:356, name:'Mark',    group:'NCT 127', birth:'2000-08-02', gender:'male', sign:'♌ Leo' },
    { id:357, name:'Haechan', group:'NCT 127', birth:'2000-06-06', gender:'male', sign:'♊ Gemini' },
  ],
  'NCT Dream': [
    { id:579, name:'Mark',   group:'NCT Dream', birth:'2000-08-02', gender:'male', sign:'♌ Leo' },
    { id:360, name:'Renjun', group:'NCT Dream', birth:'2000-03-23', gender:'male', sign:'♈ Aries' },
    { id:361, name:'Jeno',   group:'NCT Dream', birth:'2000-04-23', gender:'male', sign:'♉ Taurus' },
    { id:580, name:'Haechan',group:'NCT Dream', birth:'2000-06-06', gender:'male', sign:'♊ Gemini' },
    { id:362, name:'Jaemin', group:'NCT Dream', birth:'2000-08-13', gender:'male', sign:'♌ Leo' },
    { id:363, name:'Chenle', group:'NCT Dream', birth:'2001-11-22', gender:'male', sign:'♐ Sagittarius' },
    { id:364, name:'Jisung', group:'NCT Dream', birth:'2002-02-05', gender:'male', sign:'♒ Aquarius' },
  ],
  'WayV': [
    { id:581, name:'Kun',      group:'WayV', birth:'1996-01-01', gender:'male', sign:'♑ Capricorn' },
    { id:582, name:'Ten',      group:'WayV', birth:'1996-02-27', gender:'male', sign:'♓ Pisces' },
    { id:583, name:'Winwin',   group:'WayV', birth:'1997-10-28', gender:'male', sign:'♏ Scorpio' },
    { id:584, name:'Lucas',    group:'WayV', birth:'1999-01-25', gender:'male', sign:'♒ Aquarius' },
    { id:585, name:'Xiaojun',  group:'WayV', birth:'1999-08-08', gender:'male', sign:'♌ Leo' },
    { id:586, name:'Hendery',  group:'WayV', birth:'1999-09-28', gender:'male', sign:'♎ Libra' },
    { id:587, name:'YangYang', group:'WayV', birth:'2000-10-10', gender:'male', sign:'♎ Libra' },
  ],
  'aespa': [
    { id:20, name:'Karina',   group:'aespa', birth:'2000-04-11', gender:'female', sign:'♈ Aries' },
    { id:21, name:'Giselle',  group:'aespa', birth:'2000-10-30', gender:'female', sign:'♏ Scorpio' },
    { id:22, name:'Winter',   group:'aespa', birth:'2001-01-01', gender:'female', sign:'♑ Capricorn' },
    { id:23, name:'Ningning', group:'aespa', birth:'2002-10-23', gender:'female', sign:'♎ Libra' },
  ],
  'RIIZE': [
    { id:370, name:'Shotaro',  group:'RIIZE', birth:'2000-11-25', gender:'male', sign:'♐ Sagittarius' },
    { id:588, name:'Eunseok',  group:'RIIZE', birth:'2001-09-28', gender:'male', sign:'♎ Libra' },
    { id:371, name:'Sungchan', group:'RIIZE', birth:'2001-09-13', gender:'male', sign:'♍ Virgo' },
    { id:589, name:'Seunghan', group:'RIIZE', birth:'2002-01-05', gender:'male', sign:'♑ Capricorn' },
    { id:590, name:'Seohyun',  group:'RIIZE', birth:'2001-03-03', gender:'male', sign:'♓ Pisces' },
    { id:374, name:'Wonbin',   group:'RIIZE', birth:'2004-08-27', gender:'male', sign:'♍ Virgo' },
    { id:591, name:'Anton',    group:'RIIZE', birth:'2004-04-22', gender:'male', sign:'♉ Taurus' },
  ],
  'NCT WISH': [
    { id:592, name:'Sion',    group:'NCT WISH', birth:'2004-01-09', gender:'male', sign:'♑ Capricorn' },
    { id:593, name:'Jaehee',  group:'NCT WISH', birth:'2004-08-29', gender:'male', sign:'♍ Virgo' },
    { id:594, name:'Riku',    group:'NCT WISH', birth:'2004-09-22', gender:'male', sign:'♍ Virgo' },
    { id:595, name:'Yushi',   group:'NCT WISH', birth:'2005-02-26', gender:'male', sign:'♓ Pisces' },
    { id:596, name:'Sakuya',  group:'NCT WISH', birth:'2005-04-12', gender:'male', sign:'♈ Aries' },
    { id:597, name:'Wonhak',  group:'NCT WISH', birth:'2006-08-19', gender:'male', sign:'♌ Leo' },
  ],

  // ── STARSHIP ─────────────────────────────────────────────────────
  'IVE': [
    { id:112, name:'Yujin',    group:'IVE', birth:'2003-09-01', gender:'female', sign:'♍ Virgo' },
    { id:113, name:'Gaeul',    group:'IVE', birth:'2002-09-24', gender:'female', sign:'♎ Libra' },
    { id:114, name:'Rei',      group:'IVE', birth:'2004-02-03', gender:'female', sign:'♒ Aquarius' },
    { id:115, name:'Wonyoung', group:'IVE', birth:'2004-08-31', gender:'female', sign:'♍ Virgo' },
    { id:116, name:'Liz',      group:'IVE', birth:'2004-11-21', gender:'female', sign:'♏ Scorpio' },
    { id:117, name:'Leeseo',   group:'IVE', birth:'2007-02-21', gender:'female', sign:'♓ Pisces' },
  ],
  'MONSTA X': [
    { id:460, name:'Shownu',   group:'MONSTA X', birth:'1992-06-18', gender:'male', sign:'♊ Gemini' },
    { id:461, name:'Minhyuk',  group:'MONSTA X', birth:'1993-11-03', gender:'male', sign:'♏ Scorpio' },
    { id:462, name:'Kihyun',   group:'MONSTA X', birth:'1993-11-22', gender:'male', sign:'♐ Sagittarius' },
    { id:463, name:'Hyungwon', group:'MONSTA X', birth:'1994-01-15', gender:'male', sign:'♑ Capricorn' },
    { id:464, name:'Joohoney', group:'MONSTA X', birth:'1994-10-06', gender:'male', sign:'♎ Libra' },
    { id:465, name:'I.M',      group:'MONSTA X', birth:'1996-01-26', gender:'male', sign:'♒ Aquarius' },
  ],
  'CRAVITY': [
    { id:598, name:'Serim',     group:'CRAVITY', birth:'2000-03-28', gender:'male', sign:'♈ Aries' },
    { id:599, name:'Allen',     group:'CRAVITY', birth:'2000-10-28', gender:'male', sign:'♏ Scorpio' },
    { id:600, name:'Jungmo',    group:'CRAVITY', birth:'2000-10-05', gender:'male', sign:'♎ Libra' },
    { id:601, name:'Woobin',    group:'CRAVITY', birth:'2001-01-26', gender:'male', sign:'♒ Aquarius' },
    { id:602, name:'Wonjin',    group:'CRAVITY', birth:'2001-02-08', gender:'male', sign:'♒ Aquarius' },
    { id:603, name:'Minhee',    group:'CRAVITY', birth:'2001-07-11', gender:'male', sign:'♋ Cancer' },
    { id:604, name:'Hyeongjun', group:'CRAVITY', birth:'2002-01-09', gender:'male', sign:'♑ Capricorn' },
    { id:605, name:'Taeyoung',  group:'CRAVITY', birth:'2002-07-01', gender:'male', sign:'♋ Cancer' },
    { id:606, name:'Woosung',   group:'CRAVITY', birth:'2002-09-27', gender:'male', sign:'♎ Libra' },
  ],
  'WJSN': [
    { id:607, name:'Seola',     group:'WJSN', birth:'1996-12-27', gender:'female', sign:'♑ Capricorn' },
    { id:608, name:'Juyeon',    group:'WJSN', birth:'1997-01-03', gender:'female', sign:'♑ Capricorn' },
    { id:609, name:'EXY',       group:'WJSN', birth:'1996-10-11', gender:'female', sign:'♎ Libra' },
    { id:610, name:'Soobin',    group:'WJSN', birth:'1997-12-05', gender:'female', sign:'♐ Sagittarius' },
    { id:611, name:'Luda',      group:'WJSN', birth:'1997-03-05', gender:'female', sign:'♓ Pisces' },
    { id:612, name:'Dawon',     group:'WJSN', birth:'1996-09-17', gender:'female', sign:'♍ Virgo' },
    { id:613, name:'Bona',      group:'WJSN', birth:'1995-08-25', gender:'female', sign:'♍ Virgo' },
    { id:614, name:'Eunseo',    group:'WJSN', birth:'1998-08-27', gender:'female', sign:'♍ Virgo' },
    { id:615, name:'Cheng Xiao',group:'WJSN', birth:'1998-08-11', gender:'female', sign:'♌ Leo' },
    { id:616, name:'Meiqi',     group:'WJSN', birth:'1998-05-21', gender:'female', sign:'♊ Gemini' },
    { id:617, name:'Yeoreum',   group:'WJSN', birth:'1999-02-05', gender:'female', sign:'♒ Aquarius' },
    { id:618, name:'Dayoung',   group:'WJSN', birth:'1999-09-05', gender:'female', sign:'♍ Virgo' },
    { id:619, name:'Yeonjung',  group:'WJSN', birth:'2000-08-03', gender:'female', sign:'♌ Leo' },
  ],

  // ── CUBE ─────────────────────────────────────────────────────────
  '(G)I-DLE': [
    { id:340, name:'Miyeon',  group:'(G)I-DLE', birth:'1997-01-31', gender:'female', sign:'♒ Aquarius' },
    { id:341, name:'Minnie',  group:'(G)I-DLE', birth:'1997-10-23', gender:'female', sign:'♏ Scorpio' },
    { id:342, name:'Soyeon',  group:'(G)I-DLE', birth:'1998-08-26', gender:'female', sign:'♍ Virgo' },
    { id:343, name:'Yuqi',    group:'(G)I-DLE', birth:'1999-09-23', gender:'female', sign:'♎ Libra' },
    { id:344, name:'Shuhua',  group:'(G)I-DLE', birth:'2000-01-06', gender:'female', sign:'♑ Capricorn' },
  ],
  'LIGHTSUM': [
    { id:620, name:'Sangah',   group:'LIGHTSUM', birth:'2001-08-10', gender:'female', sign:'♌ Leo' },
    { id:621, name:'Chowon',   group:'LIGHTSUM', birth:'2003-02-17', gender:'female', sign:'♒ Aquarius' },
    { id:622, name:'Juhyeon',  group:'LIGHTSUM', birth:'2003-07-04', gender:'female', sign:'♋ Cancer' },
    { id:623, name:'Hina',     group:'LIGHTSUM', birth:'2003-08-05', gender:'female', sign:'♌ Leo' },
    { id:624, name:'Nayoung',  group:'LIGHTSUM', birth:'2004-01-18', gender:'female', sign:'♑ Capricorn' },
    { id:625, name:'Yujeong',  group:'LIGHTSUM', birth:'2003-10-11', gender:'female', sign:'♎ Libra' },
    { id:626, name:'Huiyeon',  group:'LIGHTSUM', birth:'2004-11-17', gender:'female', sign:'♏ Scorpio' },
    { id:627, name:'Sian',     group:'LIGHTSUM', birth:'2005-06-07', gender:'female', sign:'♊ Gemini' },
  ],
  'PENTAGON': [
    { id:628, name:'Hui',      group:'PENTAGON', birth:'1993-08-28', gender:'male', sign:'♍ Virgo' },
    { id:629, name:'Hongseok', group:'PENTAGON', birth:'1994-09-17', gender:'male', sign:'♍ Virgo' },
    { id:630, name:'Shinwon',  group:'PENTAGON', birth:'1995-02-11', gender:'male', sign:'♒ Aquarius' },
    { id:631, name:'Yanan',    group:'PENTAGON', birth:'1996-08-26', gender:'male', sign:'♍ Virgo' },
    { id:632, name:'Yeo One',  group:'PENTAGON', birth:'1996-06-17', gender:'male', sign:'♊ Gemini' },
    { id:633, name:'Yuto',     group:'PENTAGON', birth:'1996-10-01', gender:'male', sign:'♎ Libra' },
    { id:634, name:'Kino',     group:'PENTAGON', birth:'1998-01-27', gender:'male', sign:'♒ Aquarius' },
    { id:635, name:'Wooseok',  group:'PENTAGON', birth:'1998-07-12', gender:'male', sign:'♋ Cancer' },
  ],

  // ── KQ ───────────────────────────────────────────────────────────
  'ATEEZ': [
    { id:125, name:'Hongjoong', group:'ATEEZ', birth:'1998-11-07', gender:'male', sign:'♏ Scorpio' },
    { id:126, name:'Seonghwa',  group:'ATEEZ', birth:'1998-04-03', gender:'male', sign:'♈ Aries' },
    { id:127, name:'Yunho',     group:'ATEEZ', birth:'1999-03-23', gender:'male', sign:'♈ Aries' },
    { id:128, name:'Yeosang',   group:'ATEEZ', birth:'1999-06-15', gender:'male', sign:'♊ Gemini' },
    { id:129, name:'San',       group:'ATEEZ', birth:'1999-07-10', gender:'male', sign:'♋ Cancer' },
    { id:130, name:'Mingi',     group:'ATEEZ', birth:'1999-08-09', gender:'male', sign:'♌ Leo' },
    { id:131, name:'Wooyoung',  group:'ATEEZ', birth:'1999-11-26', gender:'male', sign:'♐ Sagittarius' },
    { id:132, name:'Jongho',    group:'ATEEZ', birth:'2000-10-12', gender:'male', sign:'♎ Libra' },
  ],
  'xikers': [
    { id:636, name:'Hyunwoo',  group:'xikers', birth:'2001-10-11', gender:'male', sign:'♎ Libra' },
    { id:637, name:'Seeun',    group:'xikers', birth:'2002-03-09', gender:'male', sign:'♓ Pisces' },
    { id:638, name:'Yechan',   group:'xikers', birth:'2002-11-03', gender:'male', sign:'♏ Scorpio' },
    { id:639, name:'Junmin',   group:'xikers', birth:'2003-07-31', gender:'male', sign:'♌ Leo' },
    { id:640, name:'Sumin',    group:'xikers', birth:'2003-04-05', gender:'male', sign:'♈ Aries' },
    { id:641, name:'Minjae',   group:'xikers', birth:'2003-09-10', gender:'male', sign:'♍ Virgo' },
    { id:642, name:'Hyunseok', group:'xikers', birth:'2004-04-16', gender:'male', sign:'♈ Aries' },
    { id:643, name:'Jinsik',   group:'xikers', birth:'2004-08-27', gender:'male', sign:'♍ Virgo' },
    { id:644, name:'Hunter',   group:'xikers', birth:'2004-09-08', gender:'male', sign:'♍ Virgo' },
  ],

  // ── WAKEONE ──────────────────────────────────────────────────────
  'ZEROBASEONE': [
    { id:383, name:'Kim Jiwoong',  group:'ZEROBASEONE', birth:'2000-03-30', gender:'male', sign:'♈ Aries' },
    { id:380, name:'Sung Hanbin',  group:'ZEROBASEONE', birth:'2002-09-26', gender:'male', sign:'♎ Libra' },
    { id:381, name:'Zhang Hao',    group:'ZEROBASEONE', birth:'2002-03-16', gender:'male', sign:'♓ Pisces' },
    { id:382, name:'Seok Matthew', group:'ZEROBASEONE', birth:'2002-06-02', gender:'male', sign:'♊ Gemini' },
    { id:386, name:'Kim Gyuvin',   group:'ZEROBASEONE', birth:'2003-04-21', gender:'male', sign:'♈ Aries' },
    { id:387, name:'Tae Rae',      group:'ZEROBASEONE', birth:'2003-11-28', gender:'male', sign:'♐ Sagittarius' },
    { id:384, name:'Park Gunwook', group:'ZEROBASEONE', birth:'2005-05-11', gender:'male', sign:'♉ Taurus' },
    { id:385, name:'Han Yujin',    group:'ZEROBASEONE', birth:'2005-10-21', gender:'male', sign:'♎ Libra' },
    { id:388, name:'Ricky',        group:'ZEROBASEONE', birth:'2006-12-26', gender:'male', sign:'♑ Capricorn' },
  ],
  'izna': [
    { id:645, name:'Hyeongyeong', group:'izna', birth:'2004-01-11', gender:'female', sign:'♑ Capricorn' },
    { id:646, name:'Sarang',      group:'izna', birth:'2005-02-23', gender:'female', sign:'♓ Pisces' },
    { id:647, name:'Hyeonju',     group:'izna', birth:'2005-07-09', gender:'female', sign:'♋ Cancer' },
    { id:648, name:'Iroha',       group:'izna', birth:'2005-08-14', gender:'female', sign:'♌ Leo' },
    { id:649, name:'Minju',       group:'izna', birth:'2005-11-15', gender:'female', sign:'♏ Scorpio' },
    { id:650, name:'Chaeha',      group:'izna', birth:'2006-01-07', gender:'female', sign:'♑ Capricorn' },
    { id:651, name:'Sebin',       group:'izna', birth:'2006-04-20', gender:'female', sign:'♈ Aries' },
    { id:652, name:'Pita',        group:'izna', birth:'2006-09-10', gender:'female', sign:'♍ Virgo' },
    { id:653, name:'Yujin',       group:'izna', birth:'2007-02-12', gender:'female', sign:'♒ Aquarius' },
  ],
  'Kep1er': [
    { id:420, name:'Yujin',    group:'Kep1er', birth:'2004-07-01', gender:'female', sign:'♋ Cancer' },
    { id:421, name:'Mashiro',  group:'Kep1er', birth:'2002-06-30', gender:'female', sign:'♋ Cancer' },
    { id:422, name:'Chaehyun', group:'Kep1er', birth:'2003-05-06', gender:'female', sign:'♉ Taurus' },
    { id:423, name:'Hikaru',   group:'Kep1er', birth:'2003-09-06', gender:'female', sign:'♍ Virgo' },
    { id:424, name:'Youngeun', group:'Kep1er', birth:'2002-09-23', gender:'female', sign:'♎ Libra' },
    { id:425, name:'Dayeon',   group:'Kep1er', birth:'2003-09-23', gender:'female', sign:'♎ Libra' },
    { id:426, name:'Xiaoting', group:'Kep1er', birth:'2002-10-25', gender:'female', sign:'♏ Scorpio' },
    { id:654, name:'Bahiyyih', group:'Kep1er', birth:'2004-10-13', gender:'female', sign:'♎ Libra' },
    { id:655, name:'Yeseo',    group:'Kep1er', birth:'2005-12-27', gender:'female', sign:'♑ Capricorn' },
  ],

  // ── FNC ──────────────────────────────────────────────────────────
  'P1Harmony': [
    { id:656, name:'Keeho',    group:'P1Harmony', birth:'2000-09-26', gender:'male', sign:'♎ Libra' },
    { id:657, name:'Theo',     group:'P1Harmony', birth:'2001-01-06', gender:'male', sign:'♑ Capricorn' },
    { id:658, name:'Jiung',    group:'P1Harmony', birth:'2001-08-08', gender:'male', sign:'♌ Leo' },
    { id:659, name:'Intak',    group:'P1Harmony', birth:'2003-01-25', gender:'male', sign:'♒ Aquarius' },
    { id:660, name:'Soul',     group:'P1Harmony', birth:'2003-11-11', gender:'male', sign:'♏ Scorpio' },
    { id:661, name:'Jongseob', group:'P1Harmony', birth:'2004-04-27', gender:'male', sign:'♉ Taurus' },
  ],
  'SF9': [
    { id:662, name:'Youngbin', group:'SF9', birth:'1993-09-23', gender:'male', sign:'♍ Virgo' },
    { id:663, name:'Inseong',  group:'SF9', birth:'1993-07-12', gender:'male', sign:'♋ Cancer' },
    { id:664, name:'Jaeyoon',  group:'SF9', birth:'1994-08-09', gender:'male', sign:'♌ Leo' },
    { id:665, name:'Dawon',    group:'SF9', birth:'1995-01-25', gender:'male', sign:'♒ Aquarius' },
    { id:666, name:'Rowoon',   group:'SF9', birth:'1996-08-07', gender:'male', sign:'♌ Leo' },
    { id:667, name:'Zuho',     group:'SF9', birth:'1996-07-14', gender:'male', sign:'♋ Cancer' },
    { id:668, name:'Taeyang',  group:'SF9', birth:'1997-02-28', gender:'male', sign:'♓ Pisces' },
    { id:669, name:'Hwiyoung', group:'SF9', birth:'1998-04-11', gender:'male', sign:'♈ Aries' },
    { id:670, name:'Chani',    group:'SF9', birth:'2000-01-17', gender:'male', sign:'♑ Capricorn' },
  ],
  'N.Flying': [
    { id:671, name:'Seunghyub', group:'N.Flying', birth:'1994-08-21', gender:'male', sign:'♌ Leo' },
    { id:672, name:'Hweseung',  group:'N.Flying', birth:'1996-03-15', gender:'male', sign:'♓ Pisces' },
    { id:673, name:'Jaehyun',   group:'N.Flying', birth:'1996-10-07', gender:'male', sign:'♎ Libra' },
    { id:674, name:'Jaesung',   group:'N.Flying', birth:'1997-06-11', gender:'male', sign:'♊ Gemini' },
    { id:675, name:'Sungho',    group:'N.Flying', birth:'2000-01-18', gender:'male', sign:'♑ Capricorn' },
  ],
  'CNBLUE': [
    { id:676, name:'Yonghwa',  group:'CNBLUE', birth:'1989-06-22', gender:'male', sign:'♊ Gemini' },
    { id:677, name:'Jonghyun', group:'CNBLUE', birth:'1990-05-15', gender:'male', sign:'♉ Taurus' },
    { id:678, name:'Minhyuk',  group:'CNBLUE', birth:'1991-02-27', gender:'male', sign:'♓ Pisces' },
    { id:679, name:'Jungshin', group:'CNBLUE', birth:'1991-09-15', gender:'male', sign:'♍ Virgo' },
  ],

  // ── RBW ──────────────────────────────────────────────────────────
  'MAMAMOO': [
    { id:320, name:'Solar',    group:'MAMAMOO', birth:'1991-02-21', gender:'female', sign:'♒ Aquarius' },
    { id:321, name:'Moonbyul', group:'MAMAMOO', birth:'1992-12-22', gender:'female', sign:'♑ Capricorn' },
    { id:322, name:'Wheein',   group:'MAMAMOO', birth:'1995-04-17', gender:'female', sign:'♈ Aries' },
    { id:323, name:'Hwasa',    group:'MAMAMOO', birth:'1995-07-23', gender:'female', sign:'♋ Cancer' },
  ],
  'ONEUS': [
    { id:680, name:'Seoho',     group:'ONEUS', birth:'1994-04-12', gender:'male', sign:'♈ Aries' },
    { id:681, name:'Leedo',     group:'ONEUS', birth:'1995-01-06', gender:'male', sign:'♑ Capricorn' },
    { id:682, name:'Hwanwoong', group:'ONEUS', birth:'1996-08-26', gender:'male', sign:'♍ Virgo' },
    { id:683, name:'Keonhee',   group:'ONEUS', birth:'1998-01-25', gender:'male', sign:'♒ Aquarius' },
    { id:684, name:'Xion',      group:'ONEUS', birth:'2000-01-01', gender:'male', sign:'♑ Capricorn' },
  ],
  'ONEWE': [
    { id:685, name:'Yonghoon',   group:'ONEWE', birth:'1994-08-01', gender:'male', sign:'♌ Leo' },
    { id:686, name:'Harin',      group:'ONEWE', birth:'1994-11-16', gender:'male', sign:'♏ Scorpio' },
    { id:687, name:'CyA',        group:'ONEWE', birth:'1995-07-17', gender:'male', sign:'♋ Cancer' },
    { id:688, name:'Dongmyeong', group:'ONEWE', birth:'1997-10-03', gender:'male', sign:'♎ Libra' },
    { id:689, name:'Youngjo',    group:'ONEWE', birth:'1997-01-04', gender:'male', sign:'♑ Capricorn' },
  ],
  'PURPLE KISS': [
    { id:690, name:'Dosie',  group:'PURPLE KISS', birth:'2000-03-07', gender:'female', sign:'♓ Pisces' },
    { id:691, name:'Miki',   group:'PURPLE KISS', birth:'2001-08-26', gender:'female', sign:'♍ Virgo' },
    { id:692, name:'Chaein', group:'PURPLE KISS', birth:'2002-05-28', gender:'female', sign:'♊ Gemini' },
    { id:693, name:'Yuki',   group:'PURPLE KISS', birth:'2002-08-13', gender:'female', sign:'♌ Leo' },
    { id:694, name:'Na Go',  group:'PURPLE KISS', birth:'2003-03-11', gender:'female', sign:'♓ Pisces' },
    { id:695, name:'Swan',   group:'PURPLE KISS', birth:'2004-05-09', gender:'female', sign:'♉ Taurus' },
  ],

  // ── WOOLLIM ──────────────────────────────────────────────────────
  'GOLDEN CHILD': [
    { id:696, name:'Daeyeol',   group:'GOLDEN CHILD', birth:'1993-08-28', gender:'male', sign:'♍ Virgo' },
    { id:697, name:'Jangjun',   group:'GOLDEN CHILD', birth:'1996-09-02', gender:'male', sign:'♍ Virgo' },
    { id:698, name:'Tag',       group:'GOLDEN CHILD', birth:'1997-05-26', gender:'male', sign:'♊ Gemini' },
    { id:699, name:'Jaehyun',   group:'GOLDEN CHILD', birth:'1997-09-11', gender:'male', sign:'♍ Virgo' },
    { id:700, name:'Youngtaek', group:'GOLDEN CHILD', birth:'1998-09-24', gender:'male', sign:'♎ Libra' },
    { id:701, name:'Joochan',   group:'GOLDEN CHILD', birth:'1998-10-04', gender:'male', sign:'♎ Libra' },
    { id:702, name:'Jibeom',    group:'GOLDEN CHILD', birth:'1998-10-15', gender:'male', sign:'♎ Libra' },
    { id:703, name:'Donghyun',  group:'GOLDEN CHILD', birth:'1999-10-20', gender:'male', sign:'♎ Libra' },
    { id:704, name:'Bomin',     group:'GOLDEN CHILD', birth:'2000-08-06', gender:'male', sign:'♌ Leo' },
  ],
  'ROCKET PUNCH': [
    { id:705, name:'Juri',      group:'ROCKET PUNCH', birth:'2000-10-15', gender:'female', sign:'♎ Libra' },
    { id:706, name:'Yunkyoung', group:'ROCKET PUNCH', birth:'2001-10-26', gender:'female', sign:'♏ Scorpio' },
    { id:707, name:'Suyun',     group:'ROCKET PUNCH', birth:'2002-07-19', gender:'female', sign:'♋ Cancer' },
    { id:708, name:'Yeonhee',   group:'ROCKET PUNCH', birth:'2002-08-30', gender:'female', sign:'♍ Virgo' },
    { id:709, name:'Dahyun',    group:'ROCKET PUNCH', birth:'2003-01-12', gender:'female', sign:'♑ Capricorn' },
    { id:710, name:'Sohee',     group:'ROCKET PUNCH', birth:'2004-04-09', gender:'female', sign:'♈ Aries' },
  ],
  'DRIPPIN': [
    { id:711, name:'Hyeop',    group:'DRIPPIN', birth:'2000-02-19', gender:'male', sign:'♒ Aquarius' },
    { id:712, name:'Yunseong', group:'DRIPPIN', birth:'2000-11-05', gender:'male', sign:'♏ Scorpio' },
    { id:713, name:'Dongyun',  group:'DRIPPIN', birth:'2001-03-01', gender:'male', sign:'♓ Pisces' },
    { id:714, name:'Junho',    group:'DRIPPIN', birth:'2001-09-06', gender:'male', sign:'♍ Virgo' },
    { id:715, name:'Minseo',   group:'DRIPPIN', birth:'2001-11-21', gender:'male', sign:'♐ Sagittarius' },
    { id:716, name:'Jaeyoung', group:'DRIPPIN', birth:'2002-02-16', gender:'male', sign:'♒ Aquarius' },
    { id:717, name:'Alex',     group:'DRIPPIN', birth:'2003-07-14', gender:'male', sign:'♋ Cancer' },
  ],
}

const BIRTH_TIMES = [
  { value:'unknown',       label:'Unknown 모름' },
  { value:'子 (11pm–1am)', label:'子시 (11pm–1am)' },
  { value:'丑 (1am–3am)',  label:'丑시 (1am–3am)' },
  { value:'寅 (3am–5am)',  label:'寅시 (3am–5am)' },
  { value:'卯 (5am–7am)',  label:'卯시 (5am–7am)' },
  { value:'辰 (7am–9am)',  label:'辰시 (7am–9am)' },
  { value:'巳 (9am–11am)', label:'巳시 (9am–11am)' },
  { value:'午 (11am–1pm)', label:'午시 (11am–1pm)' },
  { value:'未 (1pm–3pm)',  label:'未시 (1pm–3pm)' },
  { value:'申 (3pm–5pm)',  label:'申시 (3pm–5pm)' },
  { value:'酉 (5pm–7pm)',  label:'酉시 (5pm–7pm)' },
  { value:'戌 (7pm–9pm)',  label:'戌시 (7pm–9pm)' },
  { value:'亥 (9pm–11pm)', label:'亥시 (9pm–11pm)' },
]

// ── 컴포넌트 ──────────────────────────────────────────────────────

interface Props {
  user: { id: string; email: string }
  initialCredits: number
}

export default function DashboardClient({ user, initialCredits }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // ── 상태 ────────────────────────────────────────
  const [credits, setCredits]           = useState(initialCredits)
  const [mode, setMode]                 = useState<ReadingMode>('personal')
  const [lang, setLang]                 = useState('Korean')
  const [readingCats, setReadingCats]   = useState<ReadingCategory[]>([])

  // Person 1
  const [date1, setDate1]               = useState('')
  const [calendar1, setCalendar1]       = useState<'solar'|'lunar'>('solar')
  const [time1, setTime1]               = useState('unknown')
  const [gender1, setGender1]           = useState('female')
  const [place1, setPlace1]             = useState('')
  const [nickname, setNickname]         = useState('')

  // Person 2
  const [date2, setDate2]               = useState('')
  const [calendar2, setCalendar2]       = useState<'solar'|'lunar'>('solar')
  const [time2, setTime2]               = useState('unknown')
  const [gender2, setGender2]           = useState('male')

  // Idol drill-down
  const [selectedGroup, setSelectedGroup] = useState<string>('BTS')
  const [selectedIdol, setSelectedIdol] = useState<Celebrity | null>(null)
  const [showCustom, setShowCustom]     = useState(false)
  const [customName, setCustomName]     = useState('')
  const [customBirth, setCustomBirth]   = useState('')
  const [customGender, setCustomGender] = useState('male')
  const [customGroup, setCustomGroup]   = useState('')

  // 랭킹
  type RankItem = { idol_name: string; group_name: string; count: number }
  type GroupRankItem = { group_name: string; total_count: number }
  const [rankTab, setRankTab]           = useState<'individual'|'group'>('individual')
  const [indivRank, setIndivRank]       = useState<RankItem[]>([])
  const [groupRank, setGroupRank]       = useState<GroupRankItem[]>([])
  const [rankLoading, setRankLoading]   = useState(false)

  // Result
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<string | null>(null)
  const [resultTitle, setResultTitle]   = useState('')
  const [toast, setToast]               = useState('')
  const [showBuyModal, setShowBuyModal] = useState(false)

  // AI 이미지
  const [generatingImage, setGeneratingImage]     = useState(false)
  const [generatedImage, setGeneratedImage]       = useState<string | null>(null)
  const [generatingBaby, setGeneratingBaby]       = useState(false)
  const [generatedBabyImage, setGeneratedBabyImage] = useState<string | null>(null)

  // 2세 이미지용 얼굴 사진 업로드
  const [face1File, setFace1File]   = useState<File | null>(null)
  const [face2File, setFace2File]   = useState<File | null>(null)
  const [face1Preview, setFace1Preview] = useState<string | null>(null)
  const [face2Preview, setFace2Preview] = useState<string | null>(null)

  function handleFaceUpload(slot: 1 | 2, file: File | null) {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (slot === 1) { setFace1File(file); setFace1Preview(url) }
    else            { setFace2File(file); setFace2Preview(url) }
  }

  // ── 헬퍼 ────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getCurrentIdolList(): Celebrity[] {
    return GROUPS[selectedGroup] ?? []
  }

  async function fetchRankings() {
    setRankLoading(true)
    try {
      const res = await fetch('/api/rankings')
      if (res.ok) {
        const data = await res.json()
        setIndivRank(data.individual ?? [])
        setGroupRank(data.group ?? [])
      }
    } catch { /* silent */ } finally {
      setRankLoading(false)
    }
  }

  // 아이돌 탭 진입 시 랭킹 자동 로드
  useEffect(() => {
    if (mode === 'idol') fetchRankings()
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const baseCostMap: Record<ReadingMode, number> = { personal: 1, compatibility: 2, idol: 3 }
  const personalCost = mode === 'personal' ? Math.max(1, readingCats.length) : baseCostMap[mode]
  const costMap: Record<ReadingMode, number> = { ...baseCostMap, personal: personalCost }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleGenerateImage() {
    if (!result) return
    if (credits < 3) { setShowBuyModal(true); return }

    setGeneratingImage(true)
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sajuResult: result,
          mode,
          language: lang,
          gender: gender1,
          gender2: mode === 'compatibility' ? gender2
                 : mode === 'idol' ? (selectedIdol?.gender ?? customGender)
                 : undefined,
          category: mode === 'personal' ? readingCats[0] : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요.')
      setGeneratedImage(data.imageUrl)
      setCredits(data.remainingCredits)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '이미지 생성 중 오류가 발생했어요.')
    } finally {
      setGeneratingImage(false)
    }
  }

  async function handleGenerateBabyImage() {
    if (!result || !face1File || !face2File) return
    if (credits < 3) { setShowBuyModal(true); return }

    setGeneratingBaby(true)
    try {
      const formData = new FormData()
      formData.append('sajuResult', result)
      formData.append('mode', 'baby')
      formData.append('language', lang)
      formData.append('face1', face1File)
      formData.append('face2', face2File)

      const res = await fetch('/api/generate-baby-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요.')
      setGeneratedBabyImage(data.imageUrl)
      setCredits(data.remainingCredits)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '이미지 생성 중 오류가 발생했어요.')
    } finally {
      setGeneratingBaby(false)
    }
  }

  // ── 제출 ────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const cost = costMap[mode]
    if (credits < cost) {
      setShowBuyModal(true)
      return
    }
    if (!date1) { showToast(t(lang, 'enterBirth')); return }
    if (mode === 'personal' && readingCats.length === 0) { showToast(t(lang, 'selectReading')); return }
    if (mode === 'compatibility' && !date2) { showToast(t(lang, 'enterPartnerBirth')); return }
    if (mode === 'idol') {
      if (showCustom && (!customName || !customBirth)) { showToast(t(lang, 'enterCelebInfo')); return }
      if (!showCustom && !selectedIdol) { showToast(t(lang, 'selectCeleb')); return }
    }

    // 개인 사주: 이미 결과가 있으면 재소비 확인
    if (mode === 'personal' && result) {
      const confirmed = window.confirm(
        lang === 'Korean'
          ? `이미 결과가 있어요. 다시 보기하면 ${cost} 크레딧이 추가로 소비됩니다. 계속할까요?`
          : `You already have a result. Viewing again will cost ${cost} more credit${cost > 1 ? 's' : ''}. Continue?`
      )
      if (!confirmed) return
    }

    // 다중 카테고리 선택 시 확인
    if (mode === 'personal' && readingCats.length > 1) {
      const catNames = readingCats.map(c => t(lang, c)).join(', ')
      const confirmed = window.confirm(
        lang === 'Korean'
          ? `${catNames} — ${readingCats.length}가지 항목을 보면 ${cost} 크레딧이 소비됩니다. 계속할까요?`
          : `${catNames} — ${readingCats.length} readings will cost ${cost} credits. Continue?`
      )
      if (!confirmed) return
    }

    setLoading(true)
    setResult(null)
    setGeneratedImage(null)
    setGeneratedBabyImage(null)

    try {
      const body = {
        mode,
        language: lang,
        person1: { birthDate: date1, calendar: calendar1, birthTime: time1, gender: gender1, birthPlace: place1 },
        ...(mode === 'compatibility' && {
          person2: { birthDate: date2, calendar: calendar2, birthTime: time2, gender: gender2 },
        }),
        ...(mode === 'idol' && {
          celebrity: showCustom
            ? { name: customName, group: customGroup || 'Korean celebrity', birth: customBirth, gender: customGender }
            : { name: selectedIdol!.name, group: selectedIdol!.group, birth: selectedIdol!.birth, gender: selectedIdol!.gender },
        }),
        ...(mode === 'personal' && readingCats.length === 1 && { category: readingCats[0] }),
        ...(mode === 'personal' && readingCats.length > 1  && { categories: readingCats }),
      }

      const res = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요.')

      setCredits(data.remainingCredits)
      setResult(data.reading)

      const catLabel = mode === 'personal'
        ? readingCats.map(c => t(lang, c)).join(' · ')
        : mode === 'compatibility' ? t(lang, 'compatibility') : t(lang, 'idol')
      setResultTitle(catLabel)

      // 아이돌 궁합이면 랭킹 자동 갱신
      if (mode === 'idol') {
        setTimeout(() => fetchRankings(), 1500)
      }

    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [mode, lang, credits, date1, date2, calendar1, calendar2, time1, time2, gender1, gender2, place1, readingCats, selectedIdol, showCustom, customName, customBirth, customGender, customGroup, result])

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result).then(() => showToast(t(lang, 'copied')))
    }
  }

  // ── 렌더 ────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoGroup}>
            <span className={styles.logo}>운명</span>
            <span className={styles.logoSub}>UNMYEONG</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.creditsChip}>
              <span className={styles.creditNum}>{credits}</span>
              <span className={styles.creditLabel}>{t(lang,'credits')}</span>
            </div>
            <button className={styles.btnBuy} onClick={() => setShowBuyModal(true)}>{t(lang,'charge')}</button>
            <button className={styles.btnSignOut} onClick={handleSignOut}>{t(lang,'logout')}</button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        {/* Mode tabs */}
        <div className={styles.modeTabs}>
          {(['personal','compatibility','idol'] as ReadingMode[]).map(m => (
            <button
              key={m}
              className={`${styles.modeTab} ${mode === m ? styles.modeTabActive : ''}`}
              onClick={() => { setMode(m); setResult(null) }}
            >
              <span className={styles.modeKr}>{t(lang, m)}</span>
              <span className={styles.modeCost}>{tCredits(lang, costMap[m])}</span>
            </button>
          ))}
        </div>

        {/* Language */}
        <div className={styles.langRow}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`${styles.langBtn} ${lang === l.code ? styles.langBtnActive : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className={styles.formCard}>
          {/* Person 1 */}
          <div className={styles.sectionTitle}>{t(lang,'myInfo')}</div>
          <div className={styles.grid2} style={{marginBottom:'0.75rem'}}>
            <div className={styles.field}>
              <label>{t(lang,'nickname')}</label>
              <input
                type="text"
                placeholder={t(lang,'nicknamePlaceholder')}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className={styles.field}>
              <label>{t(lang,'gender')}</label>
              <select value={gender1} onChange={e=>setGender1(e.target.value)}>
                <option value="female">{t(lang,'female')}</option>
                <option value="male">{t(lang,'male')}</option>
                <option value="nonbinary">{t(lang,'nonbinary')}</option>
              </select>
            </div>
          </div>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label>{t(lang,'birthDate')}</label>
              <input type="date" value={date1} onChange={e => setDate1(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>{t(lang,'solar')} / {t(lang,'lunar')}</label>
              <div className={styles.toggle}>
                <button className={`${styles.togBtn} ${calendar1==='solar'?styles.togActive:''}`} onClick={()=>setCalendar1('solar')}>{t(lang,'solar')}</button>
                <button className={`${styles.togBtn} ${calendar1==='lunar'?styles.togActive:''}`} onClick={()=>setCalendar1('lunar')}>{t(lang,'lunar')}</button>
              </div>
            </div>
            <div className={styles.field}>
              <label>{t(lang,'birthTime')}</label>
              <select value={time1} onChange={e=>setTime1(e.target.value)}>
                <option value="unknown">{t(lang,'unknown')}</option>
                {BIRTH_TIMES.slice(1).map(bt=><option key={bt.value} value={bt.value}>{bt.label}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>{t(lang,'birthPlace')}</label>
            <input type="text" placeholder={t(lang,'birthPlacePlaceholder')} value={place1} onChange={e=>setPlace1(e.target.value)} />
          </div>

          {/* Personal: category — 최대 3개 다중선택 */}
          {mode === 'personal' && (
            <>
              <div className={styles.sectionTitle} style={{marginTop:'1.2rem'}}>
                {t(lang,'readingType')}
                <span style={{ marginLeft:'0.5rem', fontSize:'0.72rem', color:'var(--muted)', fontWeight:400 }}>
                  {lang === 'Korean'
                    ? `최대 10개 선택 가능 · 선택한 항목 수만큼 크레딧 소비 (현재 ${readingCats.length}개 선택 = ${tCredits('Korean', Math.max(1, readingCats.length))})`
                    : `Up to 10 · ${tCredits(lang, Math.max(1, readingCats.length))} (${readingCats.length} selected)`}
                </span>
              </div>
              <div className={styles.catGrid}>
                {READING_CATEGORY_IDS.map(id => {
                  const selected = readingCats.includes(id as ReadingCategory)
                  const maxed = !selected && readingCats.length >= 10
                  return (
                    <button
                      key={id}
                      className={`${styles.catBtn} ${selected ? styles.catBtnActive : ''}`}
                      style={{ position:'relative', ...(maxed ? { opacity: 0.4, cursor: 'not-allowed' } : {}) }}
                      disabled={maxed}
                      onClick={() => {
                        if (selected) {
                          setReadingCats(prev => prev.filter(c => c !== id))
                        } else if (readingCats.length < 10) {
                          setReadingCats(prev => [...prev, id as ReadingCategory])
                        }
                      }}
                    >
                      {selected && (
                        <span style={{ position:'absolute', top:'0.3rem', right:'0.35rem', fontSize:'0.65rem', color:'var(--paper)', lineHeight:1 }}>✦</span>
                      )}
                      <span className={styles.catKr}>{t(lang, id)}</span>
                      {lang === 'Korean' ? null : <span className={styles.catEn}>{t('Korean', id)}</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Compatibility: person 2 */}
          {mode === 'compatibility' && (
            <>
              <div className={styles.sectionTitle} style={{marginTop:'1.2rem'}}>{t(lang,'partnerInfo')}</div>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label>{t(lang,'birthDate')}</label>
                  <input type="date" value={date2} onChange={e=>setDate2(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>{t(lang,'solar')} / {t(lang,'lunar')}</label>
                  <div className={styles.toggle}>
                    <button className={`${styles.togBtn} ${calendar2==='solar'?styles.togActive:''}`} onClick={()=>setCalendar2('solar')}>{t(lang,'solar')}</button>
                    <button className={`${styles.togBtn} ${calendar2==='lunar'?styles.togActive:''}`} onClick={()=>setCalendar2('lunar')}>{t(lang,'lunar')}</button>
                  </div>
                </div>
                <div className={styles.field}>
                  <label>{t(lang,'birthTime')}</label>
                  <select value={time2} onChange={e=>setTime2(e.target.value)}>
                    <option value="unknown">{t(lang,'unknown')}</option>
                    {BIRTH_TIMES.slice(1).map(bt=><option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.field} style={{maxWidth:'200px'}}>
                <label>{t(lang,'gender')}</label>
                <select value={gender2} onChange={e=>setGender2(e.target.value)}>
                  <option value="male">{t(lang,'male')}</option>
                  <option value="female">{t(lang,'female')}</option>
                  <option value="nonbinary">{t(lang,'nonbinary')}</option>
                </select>
              </div>
            </>
          )}

          {/* Idol drill-down */}
          {mode === 'idol' && (
            <>
              {/* 실시간 랭킹 */}
              <div style={{ margin:'1.2rem 0 0.8rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.6rem' }}>
                  <span className={styles.sectionTitle} style={{ margin:0 }}>
                    {lang === 'Korean' ? '✦ 실시간 랭킹' : lang === 'Japanese' ? '✦ リアルタイムランキング' : lang === 'Chinese' ? '✦ 实时排行榜' : '✦ Live Rankings'}
                  </span>
                  <button
                    onClick={fetchRankings}
                    style={{ fontSize:'0.72rem', color:'var(--gold)', background:'none', border:'none', cursor:'pointer', padding:'0.2rem 0.4rem' }}
                  >
                    {rankLoading ? '...' : '↻'}
                  </button>
                </div>
                <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.6rem' }}>
                  <button
                    onClick={() => { setRankTab('individual'); if (indivRank.length === 0) fetchRankings() }}
                    style={{ fontSize:'0.75rem', padding:'0.25rem 0.8rem', borderRadius:'20px', border:'1px solid var(--border)', background: rankTab==='individual' ? 'var(--gold)' : 'transparent', color: rankTab==='individual' ? '#1a1a2e' : 'var(--muted)', cursor:'pointer', fontWeight: rankTab==='individual' ? 700 : 400 }}
                  >
                    {lang === 'Korean' ? '개인 랭킹' : lang === 'Japanese' ? '個人' : lang === 'Chinese' ? '个人排行' : 'Individual'}
                  </button>
                  <button
                    onClick={() => { setRankTab('group'); if (groupRank.length === 0) fetchRankings() }}
                    style={{ fontSize:'0.75rem', padding:'0.25rem 0.8rem', borderRadius:'20px', border:'1px solid var(--border)', background: rankTab==='group' ? 'var(--gold)' : 'transparent', color: rankTab==='group' ? '#1a1a2e' : 'var(--muted)', cursor:'pointer', fontWeight: rankTab==='group' ? 700 : 400 }}
                  >
                    {lang === 'Korean' ? '그룹 랭킹' : lang === 'Japanese' ? 'グループ' : lang === 'Chinese' ? '团体排行' : 'Group'}
                  </button>
                </div>
                <div style={{ background:'var(--paper)', border:'1px solid var(--border)', borderRadius:'8px', overflow:'hidden' }}>
                  {rankLoading ? (
                    <div style={{ padding:'1rem', textAlign:'center', color:'var(--muted)', fontSize:'0.8rem' }}>...</div>
                  ) : rankTab === 'individual' ? (
                    indivRank.length === 0 ? (
                      <div style={{ padding:'0.8rem 1rem', color:'var(--muted)', fontSize:'0.78rem' }}>
                        {lang === 'Korean' ? '아직 데이터가 없어요. 첫 번째 궁합을 확인해보세요!' : 'No data yet. Be the first!'}
                      </div>
                    ) : indivRank.map((r, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', padding:'0.45rem 1rem', borderBottom: i < indivRank.length-1 ? '1px solid var(--border)' : 'none', gap:'0.6rem' }}>
                        <span style={{ fontSize:'0.8rem', fontWeight:700, color: i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--muted)', minWidth:'1.4rem', textAlign:'center' }}>{i+1}</span>
                        <span style={{ flex:1, fontSize:'0.82rem', fontWeight:600 }}>{r.idol_name}</span>
                        <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{r.group_name}</span>
                        <span style={{ fontSize:'0.72rem', color:'var(--gold)', fontWeight:600 }}>{r.count.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    groupRank.length === 0 ? (
                      <div style={{ padding:'0.8rem 1rem', color:'var(--muted)', fontSize:'0.78rem' }}>
                        {lang === 'Korean' ? '아직 데이터가 없어요.' : 'No data yet.'}
                      </div>
                    ) : groupRank.map((r, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', padding:'0.45rem 1rem', borderBottom: i < groupRank.length-1 ? '1px solid var(--border)' : 'none', gap:'0.6rem' }}>
                        <span style={{ fontSize:'0.8rem', fontWeight:700, color: i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--muted)', minWidth:'1.4rem', textAlign:'center' }}>{i+1}</span>
                        <span style={{ flex:1, fontSize:'0.82rem', fontWeight:600 }}>{r.group_name}</span>
                        <span style={{ fontSize:'0.72rem', color:'var(--gold)', fontWeight:600 }}>{r.total_count.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.sectionTitle} style={{marginTop:'1.2rem'}}>{t(lang,'celebSelect')}</div>
              <div className={styles.drillRow}>
                {Object.keys(GROUPS).map(g => (
                  <button key={g} className={`${styles.drillBtn} ${selectedGroup===g?styles.drillActive:''}`} onClick={()=>{ setSelectedGroup(g); setSelectedIdol(null) }}>{g}</button>
                ))}
              </div>
              <div className={styles.idolGrid}>
                {getCurrentIdolList().map(idol => (
                  <div
                    key={idol.id}
                    className={`${styles.idolCard} ${selectedIdol?.id===idol.id && !showCustom ? styles.idolSelected : ''}`}
                    onClick={() => { setSelectedIdol(idol); setShowCustom(false) }}
                  >
                    <div className={styles.idolName}>{idol.name}</div>
                    <div className={styles.idolGroup}>{idol.group}</div>
                    <div className={styles.idolSign}>{idol.sign}</div>
                  </div>
                ))}
              </div>
              <button className={styles.customToggle} onClick={()=>{ setShowCustom(v=>!v); setSelectedIdol(null) }}>
                {showCustom ? t(lang,'nocelebClose') : t(lang,'noceleb')}
              </button>
              {showCustom && (
                <div className={styles.customBox}>
                  <div className={styles.grid3}>
                    <div className={styles.field}><label>{t(lang,'celebName')}</label><input type="text" placeholder={lang === 'Korean' ? '예: Taylor Swift, 뷔, Ariana Grande' : 'e.g. Taylor Swift, V, Ariana Grande'} value={customName} onChange={e=>setCustomName(e.target.value)}/></div>
                    <div className={styles.field}><label>{t(lang,'celebBirth')}</label><input type="date" value={customBirth} onChange={e=>setCustomBirth(e.target.value)}/></div>
                    <div className={styles.field}><label>{t(lang,'celebGender')}</label>
                      <select value={customGender} onChange={e=>setCustomGender(e.target.value)}>
                        <option value="male">{t(lang,'male')}</option>
                        <option value="female">{t(lang,'female')}</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.field} style={{marginTop:'0.6rem'}}><label>{t(lang,'celebGroup')}</label><input type="text" placeholder={lang === 'Korean' ? '예: Solo Artist, The 1975, NewJeans (선택)' : 'e.g. Solo Artist, The 1975, NewJeans (optional)'} value={customGroup} onChange={e=>setCustomGroup(e.target.value)}/></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Submit */}
        <button className={styles.btnSubmit} onClick={handleSubmit} disabled={loading}>
          {loading ? t(lang,'reading') : `${t(lang,'submit')} · ${tCredits(lang, costMap[mode])}`}
        </button>

        {/* Loading */}
        {loading && (
          <div className={styles.loading}>
            <div className={styles.loadingChars}>天 地 人 命</div>
            <div className={styles.loadingText}>{t(lang,'reading')}</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <div className={styles.resultTitle}>{resultTitle} {t(lang,'resultTitle')}</div>
                <div className={styles.resultEmail}>{user.email}</div>
              </div>
              <div className={styles.resultBody}>{result}</div>
            </div>

            {/* AI 이미지 생성 버튼 */}
            {!generatedImage && (
              <button
                className={styles.btnSubmit}
                style={{ marginTop:'0.75rem', background: generatingImage ? '#555' : '#3C3489' }}
                onClick={handleGenerateImage}
                disabled={generatingImage || generatingBaby}
              >
                {generatingImage ? t(lang,'aiImageLoading') : `${t(lang,'aiImageBtn')} · ${tCredits(lang, 3)}`}
              </button>
            )}

            {/* 2세 이미지 섹션 — 궁합/아이돌 전용 */}
            {(mode === 'compatibility' || mode === 'idol') && (
              <div className={styles.resultCard} style={{ marginTop:'0.75rem', padding:'1rem' }}>
                <div className={styles.sectionTitle} style={{ marginBottom:'0.75rem' }}>
                  {lang === 'Korean' ? '✦ 우리의 운명적 2세 — 얼굴 사진으로 예측' : '✦ Our Destined Child — Face Photo Prediction'}
                </div>
                <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:'0.9rem' }}>
                  {lang === 'Korean'
                    ? `두 사람의 얼굴 사진을 업로드하면 사주를 바탕으로 예상 2세 이미지를 생성합니다 · ${tCredits('Korean', 3)}`
                    : `Upload two face photos to generate a predicted future child based on your Saju · ${tCredits(lang, 3)}`}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.9rem' }}>
                  {/* 사진 1 */}
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:'0.4rem' }}>
                      {lang === 'Korean' ? '내 사진' : 'My Photo'}
                    </label>
                    <label style={{
                      display:'block', position:'relative', paddingBottom:'100%',
                      border:'1px dashed var(--border)', borderRadius:'8px', cursor:'pointer',
                      overflow:'hidden', background:'var(--paper)',
                    }}>
                      {face1Preview
                        ? <img src={face1Preview} alt="face 1" style={{
                            position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain',
                          }} />
                        : <span style={{
                            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                            color:'var(--muted)', fontSize:'0.8rem', textAlign:'center', padding:'0.5rem',
                          }}>
                            {lang === 'Korean' ? '클릭하여 업로드' : 'Click to upload'}
                          </span>}
                      <input type="file" accept="image/*" style={{ display:'none' }}
                        onChange={e => handleFaceUpload(1, e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  {/* 사진 2 */}
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:'0.4rem' }}>
                      {lang === 'Korean' ? (mode === 'compatibility' ? '상대방 사진' : '셀럽 사진') : (mode === 'compatibility' ? 'Partner Photo' : 'Celeb Photo')}
                    </label>
                    <label style={{
                      display:'block', position:'relative', paddingBottom:'100%',
                      border:'1px dashed var(--border)', borderRadius:'8px', cursor:'pointer',
                      overflow:'hidden', background:'var(--paper)',
                    }}>
                      {face2Preview
                        ? <img src={face2Preview} alt="face 2" style={{
                            position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain',
                          }} />
                        : <span style={{
                            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                            color:'var(--muted)', fontSize:'0.8rem', textAlign:'center', padding:'0.5rem',
                          }}>
                            {lang === 'Korean' ? '클릭하여 업로드' : 'Click to upload'}
                          </span>}
                      <input type="file" accept="image/*" style={{ display:'none' }}
                        onChange={e => handleFaceUpload(2, e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>
                {!generatedBabyImage && (
                  <button
                    className={styles.btnSubmit}
                    style={{ width:'100%', background: generatingBaby ? '#555' : '#5C3D8F' }}
                    onClick={handleGenerateBabyImage}
                    disabled={generatingImage || generatingBaby || !face1File || !face2File}
                  >
                    {generatingBaby
                      ? (lang === 'Korean' ? '2세 이미지 만드는 중...' : 'Generating...')
                      : (!face1File || !face2File)
                        ? (lang === 'Korean' ? '사진 2장을 먼저 업로드해주세요' : 'Upload both photos first')
                        : (lang === 'Korean' ? `✦ 2세 이미지 생성 · ${tCredits('Korean', 3)}` : `✦ Generate Baby Image · ${tCredits(lang, 3)}`)}
                  </button>
                )}
                {generatedBabyImage && (
                  <div style={{ marginTop:'0.75rem', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--border)' }}>
                    <img src={generatedBabyImage} alt="baby prediction" style={{ width:'100%', display:'block' }} />
                    <div style={{ padding:'0.8rem', display:'flex', gap:'0.6rem', justifyContent:'flex-end' }}>
                      <button className={styles.btnCopy} onClick={() => {
                        const a = document.createElement('a')
                        a.href = generatedBabyImage
                        a.download = `unmyeong-baby-${Date.now()}.png`
                        a.target = '_blank'
                        a.click()
                      }}>{t(lang,'saveImage')}</button>
                      <button className={styles.btnTwitter} onClick={() => {
                        const text = lang === 'Korean'
                          ? `✦ 우리의 운명적 2세\n\nunmyeong-tau.vercel.app\n#사주 #궁합 #AIArt #Unmyeong`
                          : `✦ Our Destined Child by Korean Saju\n\nunmyeong-tau.vercel.app\n#Saju #Compatibility #AIArt #Unmyeong`
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                      }}>{t(lang,'shareX')}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 생성된 AI 이미지 */}
            {generatedImage && (
              <div className={styles.resultCard} style={{ marginTop:'0.75rem', overflow:'hidden' }}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultTitle}>{t(lang,'aiImageTitle')}</div>
                </div>
                <div style={{ position:'relative' }}>
                  <img
                    src={generatedImage}
                    alt="AI generated saju art"
                    style={{ width:'100%', display:'block' }}
                  />
                  <div style={{ padding:'0.8rem 1rem', display:'flex', gap:'0.6rem', justifyContent:'flex-end', borderTop:'1px solid var(--border)' }}>
                    <button
                      className={styles.btnCopy}
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = generatedImage
                        a.download = `unmyeong-art-${Date.now()}.png`
                        a.target = '_blank'
                        a.click()
                      }}
                    >
                      {t(lang,'saveImage')}
                    </button>
                    <button
                      className={styles.btnTwitter}
                      onClick={() => {
                        const text = `✦ ${t(lang,'aiImageTitle')}\n\nunmyeong-tau.vercel.app\n#Saju #KoreanFortune #AIArt #Unmyeong`
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                      }}
                    >
                      {t(lang,'shareX')}
                    </button>
                  </div>
                </div>
              </div>
            )}


            <ShareCard
              result={result}
              title={resultTitle}
              mode={mode}
              celebName={mode === 'idol' ? (selectedIdol?.name || customName) : undefined}
              userName={nickname || user.email.split('@')[0]}
              language={lang}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        marginTop: '3rem',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.4rem 1.2rem',
        fontSize: '0.75rem',
        color: 'var(--muted)',
      }}>
        {[
          { href: '/pricing',  ko: '가격',           en: 'Pricing' },
          { href: '/terms',    ko: '서비스 이용약관', en: 'Terms of Service' },
          { href: '/privacy',  ko: '개인정보처리방침',en: 'Privacy Policy' },
          { href: '/refund',   ko: '환불규정',        en: 'Refund Policy' },
        ].map(link => (
          <a
            key={link.href}
            href={link.href}
            style={{ color: 'var(--muted)', textDecoration: 'none' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            {lang === 'Korean' ? link.ko : link.en}
          </a>
        ))}
        <span>· © 2025 Unmyeong</span>
      </footer>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* 크레딧 충전 모달 */}
      {showBuyModal && (
        <BuyCreditsModal onClose={() => setShowBuyModal(false)} />
      )}
    </div>
  )
}
